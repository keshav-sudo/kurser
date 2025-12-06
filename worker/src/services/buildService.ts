import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

export interface BuildResult {
  success: boolean;
  buildDir: string;
  buildLog: string;
  errorLog?: string;
  buildTime: number;
}

export class BuildService {
  private repoPath: string;
  private buildCommand: string;
  private installCommand: string;
  private outputDir: string;

  constructor(
    repoPath: string, 
    buildCommand: string = 'npm run build',
    installCommand: string = 'npm install',
    outputDir: string = 'dist'
  ) {
    this.repoPath = repoPath;
    this.buildCommand = buildCommand;
    this.installCommand = installCommand;
    this.outputDir = outputDir;
  }

  async build(): Promise<BuildResult> {
    const startTime = Date.now();
    let buildLog = '';
    let errorLog = '';

    try {
      console.log(`📦 Installing dependencies in ${this.repoPath}`);
      console.log(`   Command: ${this.installCommand}`);
      
      // Install dependencies with proper PATH and NODE_ENV
      // IMPORTANT: NODE_ENV must NOT be 'production' during npm install
      // or it will skip devDependencies (which includes vite, etc)
      const installResult = await execAsync(this.installCommand, {
        cwd: this.repoPath,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: {
          ...process.env,
          NODE_ENV: undefined, // Ensure devDependencies are installed
          NPM_CONFIG_PRODUCTION: 'false', // Force install devDependencies
          PATH: `${this.repoPath}/node_modules/.bin:${process.env.PATH}`
        }
      });
      buildLog += `[INSTALL]\n${installResult.stdout}\n`;
      if (installResult.stderr) {
        buildLog += `[INSTALL WARNINGS]\n${installResult.stderr}\n`;
      }
      
      console.log(`✅ Dependencies installed`);
      console.log(`   Checking binaries...`);
      
      // Verify binaries exist
      try {
        const binPath = path.join(this.repoPath, 'node_modules/.bin');
        const bins = await fs.readdir(binPath);
        console.log(`   Found ${bins.length} binaries: ${bins.slice(0, 5).join(', ')}${bins.length > 5 ? '...' : ''}`);
      } catch (e) {
        console.log(`   Warning: Could not read node_modules/.bin`);
      }

      console.log(`🔨 Building project with: ${this.buildCommand}`);
      
      // Run build command with node_modules/.bin in PATH
      const buildResult = await execAsync(this.buildCommand, {
        cwd: this.repoPath,
        maxBuffer: 1024 * 1024 * 10,
        env: {
          ...process.env,
          PATH: `${this.repoPath}/node_modules/.bin:${process.env.PATH}`,
          NODE_ENV: 'production'
        }
      });
      buildLog += `[BUILD]\n${buildResult.stdout}\n`;
      if (buildResult.stderr) {
        buildLog += `[BUILD WARNINGS]\n${buildResult.stderr}\n`;
      }

      // Detect and verify build output directory
      const buildDir = await this.findBuildOutput();
      
      if (!buildDir) {
        // List ALL directories to help debug (including hidden ones)
        const repoContents = await fs.readdir(this.repoPath);
        const allDirs = [];
        for (const item of repoContents) {
          const itemPath = path.join(this.repoPath, item);
          try {
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory() && item !== 'node_modules') {
              allDirs.push(item);
            }
          } catch (e) {
            // Skip if can't stat
          }
        }
        
        throw new Error(
          `Could not find build output directory.\n` +
          `Searched for: ${this.outputDir}\n` +
          `All directories found: ${allDirs.join(', ')}\n` +
          `Tip: For Next.js, add "output: 'export'" to next.config.js for static builds.`
        );
      }

      const buildTime = Math.floor((Date.now() - startTime) / 1000);
      
      console.log(`✅ Build completed in ${buildTime}s`);
      console.log(`   Output directory: ${buildDir}`);

      return {
        success: true,
        buildDir,
        buildLog,
        buildTime
      };

    } catch (error: any) {
      const buildTime = Math.floor((Date.now() - startTime) / 1000);
      errorLog = error.message || 'Build failed';
      
      if (error.stdout) {
        buildLog += `[STDOUT]\n${error.stdout}\n`;
      }
      if (error.stderr) {
        errorLog += `\n[STDERR]\n${error.stderr}`;
      }

      console.error(`❌ Build failed after ${buildTime}s:`, errorLog);

      return {
        success: false,
        buildDir: '',
        buildLog,
        errorLog,
        buildTime
      };
    }
  }

  /**
   * Smart detection of build output directory
   * Tries multiple common locations and returns the first one that exists
   */
  async findBuildOutput(): Promise<string | null> {
    // Common build output directories to check (order matters - more specific first)
    const possibleDirs = [
      this.outputDir, // User-specified or detected
      'out',          // Next.js static export
      '.next',        // Next.js default (server mode)
      'dist',         // Vite, Angular, Vue
      'build',        // CRA, some React setups
      'public',       // Gatsby, some static sites
      '.output/public', // Nuxt 3
      'dist/public',  // Some Angular configs
      'public/build', // Svelte
    ];

    // Remove duplicates while preserving order
    const uniqueDirs = Array.from(new Set(possibleDirs));

    console.log(`🔍 Searching for build output...`);
    console.log(`   Primary target: ${this.outputDir}`);

    for (const dir of uniqueDirs) {
      const fullPath = path.join(this.repoPath, dir);
      console.log(`   Checking: ${dir}`);
      
      if (await this.directoryExists(fullPath)) {
        try {
          // Check if directory has files
          const files = await fs.readdir(fullPath);
          if (files.length > 0) {
            console.log(`   ✅ Found build output: ${dir} (${files.length} items)`);
            return fullPath;
          } else {
            console.log(`   ⚠️  Directory exists but is empty: ${dir}`);
          }
        } catch (e) {
          console.log(`   ⚠️  Could not read directory: ${dir}`);
        }
      } else {
        console.log(`   ❌ Not found: ${dir}`);
      }
    }

    console.log(`   ❌ No build output found in any checked location`);
    return null;
  }

  async detectFramework(): Promise<string> {
    try {
      const packageJsonPath = path.join(this.repoPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      // Detect framework based on dependencies
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps['next']) return 'next';
      if (deps['vite']) return 'vite';
      if (deps['react-scripts']) return 'create-react-app';
      if (deps['@angular/core']) return 'angular';
      if (deps['vue']) return 'vue';
      if (deps['svelte']) return 'svelte';
      if (deps['nuxt']) return 'nuxt';
      if (deps['gatsby']) return 'gatsby';
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async detectNextJsConfig(): Promise<{ hasOutput: boolean; outputType: string }> {
    try {
      const nextConfigPath = path.join(this.repoPath, 'next.config.js');
      const nextConfigMjsPath = path.join(this.repoPath, 'next.config.mjs');
      
      let configContent = '';
      if (await this.fileExists(nextConfigPath)) {
        configContent = await fs.readFile(nextConfigPath, 'utf-8');
      } else if (await this.fileExists(nextConfigMjsPath)) {
        configContent = await fs.readFile(nextConfigMjsPath, 'utf-8');
      }
      
      // Check if static export is configured
      if (configContent.includes('output:') && configContent.includes('export')) {
        return { hasOutput: true, outputType: 'export' };
      }
      
      return { hasOutput: false, outputType: 'default' };
    } catch {
      return { hasOutput: false, outputType: 'default' };
    }
  }

  async autoDetectBuildConfig(): Promise<{
    buildCommand: string;
    installCommand: string;
    outputDir: string;
  }> {
    const framework = await this.detectFramework();
    
    // Check package manager
    const hasYarnLock = await this.fileExists(path.join(this.repoPath, 'yarn.lock'));
    const hasPnpmLock = await this.fileExists(path.join(this.repoPath, 'pnpm-lock.yaml'));
    
    let installCommand = 'npm install'; // Use npm install, NOT npm ci (includes devDependencies)
    let buildPrefix = 'npm run';
    
    if (hasPnpmLock) {
      installCommand = 'pnpm install';
      buildPrefix = 'pnpm';
    } else if (hasYarnLock) {
      installCommand = 'yarn install';
      buildPrefix = 'yarn';
    }

    // Framework-specific configs
    const configs: Record<string, any> = {
      'next': { buildCommand: `${buildPrefix} build`, outputDir: '.next' },
      'vite': { buildCommand: `${buildPrefix} build`, outputDir: 'dist' },
      'create-react-app': { buildCommand: `${buildPrefix} build`, outputDir: 'build' },
      'angular': { buildCommand: `${buildPrefix} build`, outputDir: 'dist' },
      'vue': { buildCommand: `${buildPrefix} build`, outputDir: 'dist' },
      'svelte': { buildCommand: `${buildPrefix} build`, outputDir: 'public/build' },
      'nuxt': { buildCommand: `${buildPrefix} build`, outputDir: '.output/public' },
      'gatsby': { buildCommand: `${buildPrefix} build`, outputDir: 'public' },
      'unknown': { buildCommand: `${buildPrefix} build`, outputDir: 'dist' }
    };

    let config = { ...configs[framework], installCommand };

    // Special handling for Next.js - check if static export is configured
    if (framework === 'next') {
      const nextConfig = await this.detectNextJsConfig();
      if (nextConfig.hasOutput && nextConfig.outputType === 'export') {
        config.outputDir = 'out';
      }
    }

    return config;
  }

  private async directoryExists(dir: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async fileExists(file: string): Promise<boolean> {
    try {
      await fs.access(file);
      return true;
    } catch {
      return false;
    }
  }
}

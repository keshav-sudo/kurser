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

      // Verify build output exists
      const buildDir = path.join(this.repoPath, this.outputDir);
      const buildExists = await this.directoryExists(buildDir);
      
      if (!buildExists) {
        throw new Error(`Build directory '${this.outputDir}' not found after build`);
      }

      const buildTime = Math.floor((Date.now() - startTime) / 1000);
      
      console.log(`✅ Build completed in ${buildTime}s`);

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
      
      return 'unknown';
    } catch {
      return 'unknown';
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
      'next': { buildCommand: `${buildPrefix} build`, outputDir: 'out' },
      'vite': { buildCommand: `${buildPrefix} build`, outputDir: 'dist' },
      'create-react-app': { buildCommand: `${buildPrefix} build`, outputDir: 'build' },
      'angular': { buildCommand: `${buildPrefix} build`, outputDir: 'dist' },
      'vue': { buildCommand: `${buildPrefix} build`, outputDir: 'dist' },
      'svelte': { buildCommand: `${buildPrefix} build`, outputDir: 'public/build' },
      'unknown': { buildCommand: `${buildPrefix} build`, outputDir: 'dist' }
    };

    return {
      ...configs[framework],
      installCommand
    };
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

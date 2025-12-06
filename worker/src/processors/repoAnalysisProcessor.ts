import { Job } from 'bullmq';
import { GitService } from '../services/gitService';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function processRepoAnalysis(job: Job) {
  const { repoId, repoFullName, repoPath, branch, commitSha, prNumber } = job.data;

  console.log(`🔍 Analyzing repository: ${repoFullName}`);

  const gitService = new GitService(repoFullName);

  try {
    // Get repository statistics
    const files = await gitService.listFiles();
    const latestCommit = await gitService.getLatestCommit();

    console.log(`📊 Found ${files.length} files`);

    // Analyze file types
    const fileTypeCount: Record<string, number> = {};
    let totalLines = 0;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      fileTypeCount[ext] = (fileTypeCount[ext] || 0) + 1;

      // Count lines for code files
      if (isCodeFile(ext)) {
        try {
          const content = await gitService.getFileContent(file);
          const lines = content.split('\n').length;
          totalLines += lines;
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }

    // Detect project type
    const projectType = await detectProjectType(gitService);

    console.log(`✅ Analysis complete: ${projectType} project with ${files.length} files`);

    // Build and deploy if it's a frontend project
    let deploymentUrl = null;
    if (await isFrontendProject(gitService, projectType)) {
      console.log('🚀 Detected frontend project, attempting to build and deploy...');
      try {
        deploymentUrl = await buildAndDeploy(repoPath, projectType, repoFullName);
        console.log(`✅ Deployment successful: ${deploymentUrl}`);
      } catch (deployError: any) {
        console.error(`❌ Deployment failed: ${deployError.message}`);
      }
    } else {
      console.log('ℹ️  Not a frontend project, skipping deployment');
    }

    const analysis = {
      repoId,
      repoFullName,
      branch: branch || 'default',
      commitSha: commitSha || latestCommit?.hash,
      fileCount: files.length,
      fileTypes: fileTypeCount,
      totalLines,
      projectType,
      deploymentUrl,
      analyzedAt: new Date().toISOString(),
      latestCommit: {
        hash: latestCommit?.hash,
        message: latestCommit?.message,
        author: latestCommit?.author_name,
        date: latestCommit?.date,
      },
    };

    // Optional: Clean up cloned repo after analysis
    // await gitService.cleanup();

    return analysis;
  } catch (error: any) {
    console.error(`❌ Repository analysis failed:`, error);
    throw error;
  }
}

function isCodeFile(ext: string): boolean {
  const codeExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.cs',
    '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.r',
    '.vue', '.html', '.css', '.scss', '.less', '.sql', '.sh', '.yaml', '.yml'
  ];
  return codeExtensions.includes(ext);
}

async function detectProjectType(gitService: GitService): Promise<string> {
  try {
    const files = await gitService.listFiles();
    
    if (files.includes('package.json')) {
      // Check if it's a frontend or backend project
      const packageJsonContent = await gitService.getFileContent('package.json').catch(() => '{}');
      const packageJson = JSON.parse(packageJsonContent);
      
      if (packageJson.dependencies?.react || packageJson.dependencies?.vue || packageJson.dependencies?.['@angular/core']) {
        return 'Frontend (React/Vue/Angular)';
      }
      if (packageJson.dependencies?.express || packageJson.dependencies?.fastify || packageJson.dependencies?.koa) {
        return 'Backend (Node.js)';
      }
      return 'Node.js/JavaScript';
    }
    if (files.includes('requirements.txt') || files.includes('setup.py')) return 'Python';
    if (files.includes('pom.xml') || files.includes('build.gradle')) return 'Java';
    if (files.includes('Cargo.toml')) return 'Rust';
    if (files.includes('go.mod')) return 'Go';
    if (files.includes('Gemfile')) return 'Ruby';
    if (files.includes('composer.json')) return 'PHP';
    if (files.includes('Package.swift')) return 'Swift';
    if (files.some(f => f.endsWith('.csproj'))) return 'C#/.NET';
    if (files.some(f => f.endsWith('.sln'))) return 'C#/.NET';
    
    return 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

async function isFrontendProject(gitService: GitService, projectType: string): Promise<boolean> {
  // Check if it's explicitly detected as frontend
  if (projectType.includes('Frontend')) {
    return true;
  }

  // Check for common frontend indicators
  const files = await gitService.listFiles();
  const hasPublicFolder = files.some(f => f.startsWith('public/'));
  const hasIndexHtml = files.includes('index.html') || files.includes('public/index.html');
  const hasViteConfig = files.includes('vite.config.js') || files.includes('vite.config.ts');
  const hasWebpackConfig = files.includes('webpack.config.js');
  
  return hasPublicFolder || hasIndexHtml || hasViteConfig || hasWebpackConfig;
}

async function buildAndDeploy(repoPath: string, projectType: string, repoFullName: string): Promise<string> {
  console.log(`📦 Building project at: ${repoPath}`);

  try {
    // Check if package.json has build script
    const packageJsonPath = path.join(repoPath, 'package.json');
    let hasBuildScript = false;
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      hasBuildScript = !!packageJson.scripts?.build;
    } catch (e) {
      console.log('No package.json found or invalid');
    }

    if (!hasBuildScript) {
      console.log('⚠️  No build script found, skipping build');
      return 'No build script configured';
    }

    // Use Nixpacks to plan the build
    console.log('📋 Planning build with Nixpacks...');
    const { stdout: planOutput } = await execAsync(
      `nixpacks plan ${repoPath}`,
      { cwd: repoPath, timeout: 60000 }
    );
    console.log('Nixpacks plan:', planOutput);

    // Install dependencies - ALWAYS use npm install (NOT npm ci)
    // npm ci skips devDependencies in production mode which breaks build tools like vite
    console.log('📥 Installing dependencies...');
    let installSuccess = false;
    
    // Try 1: npm install --include=dev --force (most reliable)
    try {
      console.log('Using npm install --include=dev --force for reliable devDependencies install...');
      await execAsync('npm install --include=dev --force', { 
        cwd: repoPath, 
        timeout: 300000,
        env: {
          ...process.env,
          NODE_ENV: undefined,  // Don't set production during install
          NPM_CONFIG_PRODUCTION: 'false'  // Ensure devDependencies are installed
        }
      });
      installSuccess = true;
    } catch (e) {
      console.log('npm install --include=dev --force failed, trying without --force...');
    }
    
    // Try 2: npm install with --include=dev
    if (!installSuccess) {
      try {
        await execAsync('npm install --include=dev', { 
          cwd: repoPath, 
          timeout: 300000,
          env: {
            ...process.env,
            NODE_ENV: undefined,
            NPM_CONFIG_PRODUCTION: 'false'
          }
        });
        installSuccess = true;
      } catch (e) {
        console.log('npm install --include=dev failed, trying with --legacy-peer-deps...');
      }
    }
    
    // Try 3: npm install with --legacy-peer-deps
    if (!installSuccess) {
      console.log('Using npm install --legacy-peer-deps as fallback...');
      await execAsync('npm install --legacy-peer-deps --include=dev', { 
        cwd: repoPath, 
        timeout: 300000,
        env: {
          ...process.env,
          NODE_ENV: undefined,
          NPM_CONFIG_PRODUCTION: 'false'
        }
      });
      installSuccess = true;
    }

    console.log('✅ Dependencies installed successfully (including devDependencies)');

    // Fix Vite config to use relative base path for Azure nested deployments
    console.log('🔧 Checking Vite configuration...');
    await fixViteBasePathIfNeeded(repoPath);

    // Build using npm (guided by Nixpacks plan but executed directly)
    console.log('🔨 Building project...');
    const { stdout, stderr } = await execAsync('npm run build', { 
      cwd: repoPath, 
      timeout: 300000,
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        PATH: `${repoPath}/node_modules/.bin:${process.env.PATH}`  // Ensure local binaries are in PATH
      }
    });
    
    if (stdout) console.log('Build output:', stdout.substring(0, 500));
    
    console.log('✅ Build completed successfully');

    // Find build output directory
    const distDir = await findDistDirectory(repoPath);
    console.log(`📁 Build output: ${distDir}`);

    // Deploy to Azure Blob Storage (if configured)
    const azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (azureConnectionString) {
      console.log('☁️  Deploying to Azure Blob Storage...');
      const deploymentUrl = await deployToAzure(distDir, repoFullName);
      return deploymentUrl;
    } else {
      console.log('⚠️  Azure Storage not configured, skipping deployment');
      return `Local build complete at: ${distDir}`;
    }
  } catch (error: any) {
    console.error('❌ Build/Deploy error:', error.message);
    throw new Error(`Build failed: ${error.message}`);
  }
}

async function detectBuildCommand(repoPath: string): Promise<string> {
  try {
    const packageJsonPath = path.join(repoPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    if (packageJson.scripts?.build) {
      return 'npm run build';
    }
    if (packageJson.scripts?.dist) {
      return 'npm run dist';
    }
  } catch (error) {
    // Package.json not found or not parseable
  }
  
  return 'npm run build'; // Default
}

async function findDistDirectory(repoPath: string): Promise<string> {
  const possibleDirs = [
    'out',       // Next.js static export
    '.next',     // Next.js default build
    'dist',      // Vite, Angular, Vue
    'build',     // CRA, some React setups
    'public',    // Gatsby, some static sites
    '.output/public', // Nuxt 3
  ];
  
  console.log(`🔍 Searching for build output in: ${possibleDirs.join(', ')}`);
  
  for (const dir of possibleDirs) {
    const fullPath = path.join(repoPath, dir);
    console.log(`   Checking: ${dir}`);
    
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        // Check if directory has any content
        const contents = await fs.readdir(fullPath);
        if (contents.length > 0) {
          console.log(`   ✅ Found: ${dir} (${contents.length} items)`);
          
          // For .next directory, check if it has expected structure
          if (dir === '.next') {
            // Check for standalone or server folder - indicates Next.js server build
            const hasStandalone = contents.includes('standalone');
            const hasServer = contents.includes('server');
            const hasStatic = contents.includes('static');
            
            if (hasStatic || hasServer || hasStandalone) {
              console.log(`   ✅ Valid Next.js build directory found`);
              return fullPath;
            }
          }
          
          // For other directories, check if has index.html (static sites)
          const indexPath = path.join(fullPath, 'index.html');
          try {
            await fs.access(indexPath);
            console.log(`   ✅ Has index.html - valid static site`);
            return fullPath;
          } catch {
            // No index.html - might be Next.js or other build
            // If it's the first directory with content, use it anyway
            console.log(`   ⚠️  No index.html but has content - using it`);
            return fullPath;
          }
        } else {
          console.log(`   ⚠️  Directory exists but is empty`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Not found: ${dir}`);
      // Directory doesn't exist, continue
    }
  }
  
  // If nothing found, list what's actually there
  console.log(`❌ Could not find build output. Listing repository root contents:`);
  try {
    const rootContents = await fs.readdir(repoPath);
    const dirs = [];
    for (const item of rootContents) {
      try {
        const itemPath = path.join(repoPath, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory() && item !== 'node_modules') {
          dirs.push(item);
        }
      } catch (e) {
        // Skip
      }
    }
    console.log(`   Available directories: ${dirs.join(', ')}`);
  } catch (e) {
    console.log(`   Could not list directory contents`);
  }
  
  throw new Error('Could not find build output directory. For Next.js, ensure "output: \'export\'" is set in next.config.js for static deployments.');
}

async function deployToAzure(distDir: string, repoFullName: string): Promise<string> {
  const { BlobServiceClient } = await import('@azure/storage-blob');
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const containerName = '$web';
  
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Ensure container exists
  await containerClient.createIfNotExists({ access: 'blob' });
  
  // Create nested folder structure: username/repo-name/
  const [username, repoName] = repoFullName.split('/');
  const azurePrefix = `${username}/${repoName}`;
  
  console.log(`📂 Deploying to nested path: ${azurePrefix}/`);
  
  // Upload all files
  const files = await getAllFiles(distDir);
  console.log(`📤 Uploading ${files.length} files to Azure...`);
  
  let uploadedCount = 0;
  for (const filePath of files) {
    const relativePath = path.relative(distDir, filePath);
    // Add username/repo-name prefix to blob path
    const blobName = `${azurePrefix}/${relativePath}`.replace(/\\/g, '/');
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const contentType = getContentType(filePath);
    
    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: { blobContentType: contentType }
    });
    
    uploadedCount++;
    if (uploadedCount % 10 === 0) {
      console.log(`  📤 Uploaded ${uploadedCount}/${files.length} files`);
    }
  }
  
  console.log(`✅ Uploaded ${files.length} files to Azure Blob Storage`);
  
  // Return multiple URL formats for easy access
  const accountName = blobServiceClient.accountName;
  
  // URL 1: Static website URL (if enabled) - cleaner but needs static website feature
  const staticWebUrl = `https://${accountName}.z13.web.core.windows.net/${azurePrefix}/`;
  
  // URL 2: Direct blob URL - always works
  const directBlobUrl = `https://${accountName}.blob.core.windows.net/$web/${azurePrefix}/index.html`;
  
  console.log(`🌐 Deployment URLs:`);
  console.log(`   Static Website: ${staticWebUrl}`);
  console.log(`   Direct Blob: ${directBlobUrl}`);
  
  // Return the direct blob URL as primary (since it's working)
  return directBlobUrl;
}

async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  
  return arrayOfFiles;
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Fix Vite config to use relative base path for nested Azure deployments
 * This ensures assets load correctly from username/repo-name/ paths
 */
async function fixViteBasePathIfNeeded(repoPath: string): Promise<void> {
  const viteConfigJS = path.join(repoPath, 'vite.config.js');
  const viteConfigTS = path.join(repoPath, 'vite.config.ts');
  
  let configFile: string | null = null;
  
  try {
    await fs.access(viteConfigJS);
    configFile = viteConfigJS;
    console.log('   Found vite.config.js');
  } catch {
    try {
      await fs.access(viteConfigTS);
      configFile = viteConfigTS;
      console.log('   Found vite.config.ts');
    } catch {
      console.log('   No Vite config found, skipping base path fix');
      return;
    }
  }
  
  // Read current config
  const configContent = await fs.readFile(configFile, 'utf-8');
  
  // Check if base is already set correctly
  if (configContent.includes("base: './'") || configContent.includes('base: "./"')) {
    console.log('   ✅ Vite base path already set to relative');
    return;
  }
  
  // Check if base is set to something else
  if (configContent.includes('base:')) {
    console.log('   ⚠️  Vite base path is set but not to relative - updating...');
    // Replace existing base with relative
    const updatedConfig = configContent.replace(/base:\s*['"][^'"]*['"]/g, "base: './'");
    await fs.writeFile(configFile, updatedConfig, 'utf-8');
    console.log('   ✅ Updated Vite base path to relative');
    return;
  }
  
  // Need to add base property
  console.log('   🔧 Adding relative base path to Vite config...');
  
  // Try to insert base property after plugins array
  if (configContent.includes('plugins:')) {
    // Find the closing of plugins array and insert base after it
    const updatedConfig = configContent.replace(
      /(plugins:\s*\[[^\]]*\])/,
      "$1,\n  base: './' // Added by Kurser for Azure nested paths"
    );
    await fs.writeFile(configFile, updatedConfig, 'utf-8');
    console.log('   ✅ Added relative base path to Vite config');
  } else {
    // Just append to the config object
    const updatedConfig = configContent.replace(
      /export default defineConfig\(\{/,
      "export default defineConfig({\n  base: './', // Added by Kurser for Azure nested paths"
    );
    await fs.writeFile(configFile, updatedConfig, 'utf-8');
    console.log('   ✅ Added relative base path to Vite config');
  }
}

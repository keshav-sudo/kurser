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
        deploymentUrl = await buildAndDeploy(repoPath, projectType);
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

async function buildAndDeploy(repoPath: string, projectType: string): Promise<string> {
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

    // Install dependencies - try multiple approaches
    console.log('📥 Installing dependencies...');
    let installSuccess = false;
    
    // Try 1: Check for lock file and use npm ci
    try {
      const lockFilePath = path.join(repoPath, 'package-lock.json');
      await fs.access(lockFilePath);
      console.log('Found package-lock.json, using npm ci...');
      await execAsync('npm ci --legacy-peer-deps', { cwd: repoPath, timeout: 300000 });
      installSuccess = true;
    } catch (e) {
      console.log('npm ci failed or no lock file, trying npm install...');
    }
    
    // Try 2: npm install with legacy-peer-deps
    if (!installSuccess) {
      try {
        await execAsync('npm install --legacy-peer-deps', { cwd: repoPath, timeout: 300000 });
        installSuccess = true;
      } catch (e) {
        console.log('npm install --legacy-peer-deps failed, trying with --force...');
      }
    }
    
    // Try 3: npm install with --force (overrides all conflicts)
    if (!installSuccess) {
      console.log('Using npm install --force to resolve conflicts...');
      await execAsync('npm install --force', { cwd: repoPath, timeout: 300000 });
      installSuccess = true;
    }

    console.log('✅ Dependencies installed successfully');

    // Build using npm (guided by Nixpacks plan but executed directly)
    console.log('🔨 Building project...');
    const { stdout, stderr } = await execAsync('npm run build', { 
      cwd: repoPath, 
      timeout: 300000,
      env: { ...process.env, NODE_ENV: 'production' }
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
      const deploymentUrl = await deployToAzure(distDir);
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
  const possibleDirs = ['dist', 'build', 'out', 'public'];
  
  for (const dir of possibleDirs) {
    const fullPath = path.join(repoPath, dir);
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        // Check if it has an index.html
        const indexPath = path.join(fullPath, 'index.html');
        try {
          await fs.access(indexPath);
          return fullPath;
        } catch {
          // No index.html, continue checking
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }
  
  throw new Error('Could not find build output directory');
}

async function deployToAzure(distDir: string): Promise<string> {
  const { BlobServiceClient } = await import('@azure/storage-blob');
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const containerName = '$web';
  
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Ensure container exists
  await containerClient.createIfNotExists({ access: 'blob' });
  
  // Upload all files
  const files = await getAllFiles(distDir);
  console.log(`📤 Uploading ${files.length} files to Azure...`);
  
  for (const filePath of files) {
    const relativePath = path.relative(distDir, filePath);
    const blobName = relativePath.replace(/\\/g, '/');
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const contentType = getContentType(filePath);
    
    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: { blobContentType: contentType }
    });
  }
  
  console.log(`✅ Uploaded ${files.length} files to Azure Blob Storage`);
  
  // Return the Azure blob URL (accessible immediately)
  const accountName = blobServiceClient.accountName;
  const blobUrl = `https://${accountName}.blob.core.windows.net/$web/index.html`;
  console.log(`🌐 Deployment URL: ${blobUrl}`);
  
  return blobUrl;
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

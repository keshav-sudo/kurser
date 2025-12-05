import { Job } from 'bullmq';
import { GitService } from '../services/gitService';
import { BuildService } from '../services/buildService';
import { AzureBlobService } from '../services/azureBlobService';
import axios from 'axios';
import { config } from '../config/env';

export interface DeploymentJobData {
  deploymentId: string;
  projectId: string;
  repoFullName: string;
  branch: string;
  commitSha: string;
  cloneUrl: string;
  accessToken?: string;
  buildCommand?: string;
  installCommand?: string;
  buildDir?: string;
}

export async function processDeployment(job: Job<DeploymentJobData>) {
  const {
    deploymentId,
    projectId,
    repoFullName,
    branch,
    commitSha,
    cloneUrl,
    accessToken,
    buildCommand,
    installCommand,
    buildDir
  } = job.data;

  console.log(`🚀 Starting deployment: ${deploymentId}`);
  console.log(`   Repo: ${repoFullName}`);
  console.log(`   Branch: ${branch}`);
  console.log(`   Commit: ${commitSha}`);

  const startTime = Date.now();

  try {
    // Update status to building
    await updateDeploymentStatus(deploymentId, 'building');

    // Step 1: Clone repository
    console.log(`\n📦 Step 1: Cloning repository...`);
    const gitService = new GitService(repoFullName, accessToken);
    const repoPath = await gitService.cloneOrPull(cloneUrl);
    
    // Checkout specific branch/commit
    await gitService.checkout(branch);
    console.log(`✅ Repository cloned to: ${repoPath}`);

    // Step 2: Build project
    console.log(`\n🔨 Step 2: Building project...`);
    
    // Auto-detect build config if not provided
    let finalBuildCommand = buildCommand;
    let finalInstallCommand = installCommand;
    let finalBuildDir = buildDir;
    
    if (!buildCommand || !buildDir || !installCommand) {
      console.log(`🔍 Auto-detecting build configuration...`);
      const tempBuildService = new BuildService(repoPath, '', '', '');
      const detected = await tempBuildService.autoDetectBuildConfig();
      const framework = await tempBuildService.detectFramework();
      
      finalBuildCommand = buildCommand || detected.buildCommand;
      finalInstallCommand = installCommand || detected.installCommand;
      finalBuildDir = buildDir || detected.outputDir;
      
      console.log(`   Framework: ${framework}`);
      console.log(`   Install: ${finalInstallCommand}`);
      console.log(`   Build: ${finalBuildCommand}`);
      console.log(`   Output: ${finalBuildDir}`);
    }
    
    const buildService = new BuildService(
      repoPath,
      finalBuildCommand,
      finalInstallCommand,
      finalBuildDir
    );

    const buildResult = await buildService.build();

    if (!buildResult.success) {
      await updateDeploymentStatus(deploymentId, 'failed', {
        buildLog: buildResult.buildLog,
        errorLog: buildResult.errorLog,
        buildTime: buildResult.buildTime
      });
      throw new Error(`Build failed: ${buildResult.errorLog}`);
    }

    console.log(`✅ Build completed in ${buildResult.buildTime}s`);

    // Step 3: Upload to Azure Blob
    console.log(`\n☁️  Step 3: Uploading to Azure Blob Storage...`);
    await updateDeploymentStatus(deploymentId, 'uploading');

    const azureService = new AzureBlobService();
    const uploadResult = await azureService.uploadBuild(
      buildResult.buildDir,
      projectId,
      deploymentId
    );

    if (!uploadResult.success) {
      await updateDeploymentStatus(deploymentId, 'failed', {
        buildLog: buildResult.buildLog,
        errorLog: uploadResult.error,
        buildTime: buildResult.buildTime
      });
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }

    console.log(`✅ Uploaded ${uploadResult.fileCount} files`);

    // Step 4: Mark as ready
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    
    // Get deployment URL
    const deploymentUrl = `https://${deploymentId}.preview.example.com`;
    
    await updateDeploymentStatus(deploymentId, 'ready', {
      buildLog: buildResult.buildLog,
      buildTime: totalTime,
      azurePath: uploadResult.azurePath,
      previewUrl: deploymentUrl
    });

    console.log(`\n🎉 Deployment successful!`);
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Azure path: ${uploadResult.azurePath}`);
    console.log(`   🌍 Preview URL: ${deploymentUrl}`);

    // Cleanup cloned repo
    await gitService.cleanup();

    return {
      success: true,
      deploymentId,
      azurePath: uploadResult.azurePath,
      buildTime: totalTime,
      previewUrl: deploymentUrl
    };

  } catch (error: any) {
    console.error(`❌ Deployment failed:`, error);
    
    // Update status to failed if not already updated
    try {
      await updateDeploymentStatus(deploymentId, 'failed', {
        errorLog: error.message || 'Unknown error'
      });
    } catch (updateError) {
      console.error('Failed to update deployment status:', updateError);
    }

    throw error;
  }
}

async function updateDeploymentStatus(
  deploymentId: string,
  status: string,
  extraData: Record<string, any> = {}
) {
  try {
    await axios.patch(
      `${config.mainApiUrl}/api/deployments/${deploymentId}`,
      { status, ...extraData }
    );
  } catch (error) {
    console.error('Failed to update deployment status:', error);
  }
}

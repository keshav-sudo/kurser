import { Job } from 'bullmq';
import { GitService } from '../services/gitService';
import { addRepoAnalysisJob } from '../config/queue';

export async function processRepoClone(job: Job) {
  const { repoId, repoFullName, branch, cloneUrl, commitSha, prNumber, accessToken } = job.data;

  console.log(`🔄 Cloning repository: ${repoFullName} (${branch || 'default'})`);

  const gitService = new GitService(repoFullName, accessToken);

  try {
    // Clone or pull the repository
    const repoPath = await gitService.cloneOrPull(cloneUrl);

    // Checkout specific branch if provided
    if (branch) {
      await gitService.checkout(branch);
    }

    console.log(`✅ Repository ready at: ${repoPath}`);

    // Queue analysis job
    await addRepoAnalysisJob({
      repoId,
      repoFullName,
      repoPath,
      branch,
      commitSha,
      prNumber,
    });

    return {
      success: true,
      repoPath,
      branch,
    };
  } catch (error: any) {
    console.error(`❌ Repository clone failed:`, error);
    throw error;
  }
}

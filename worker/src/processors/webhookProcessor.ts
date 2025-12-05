import { Job } from 'bullmq';
import axios from 'axios';
import { config } from '../config/env';
import { addRepoCloneJob, addDeploymentJob } from '../config/queue';

export async function processWebhookEvent(job: Job) {
  const { eventId, event, repoId, repoFullName, payload, accessToken } = job.data;

  console.log(`🔄 Processing webhook: ${event} for ${repoFullName}`);

  try {
    // Update event status to processing
    await updateEventStatus(eventId, 'processing');

    // Handle different event types
    switch (event) {
      case 'push':
        await handlePushEvent(payload, repoId, repoFullName, accessToken);
        break;
      case 'pull_request':
        await handlePullRequestEvent(payload, repoId, repoFullName, accessToken);
        break;
      case 'issues':
        await handleIssuesEvent(payload, repoId, repoFullName);
        break;
      case 'commit_comment':
        await handleCommitCommentEvent(payload, repoId, repoFullName);
        break;
      default:
        console.log(`ℹ️  Unhandled event type: ${event}`);
    }

    // Update event status to completed
    await updateEventStatus(eventId, 'completed');

    console.log(`✅ Webhook processed: ${event} for ${repoFullName}`);
    
    return { success: true, eventId, event };
  } catch (error: any) {
    console.error(`❌ Webhook processing failed:`, error);
    
    // Update event status to failed
    await updateEventStatus(eventId, 'failed', error.message);
    
    throw error;
  }
}

async function handlePushEvent(payload: any, repoId: string, repoFullName: string, accessToken?: string) {
  const branch = payload.ref?.replace('refs/heads/', '');
  const commits = payload.commits || [];
  const commitSha = payload.after;

  console.log(`📝 Push to ${branch}: ${commits.length} commits`);

  // Check if this is a deployment branch (main, master, production)
  const deployBranches = ['main', 'master', 'production', 'deploy'];
  const shouldDeploy = deployBranches.includes(branch);

  if (shouldDeploy) {
    console.log(`🚀 Triggering deployment for branch: ${branch}`);
    
    // Generate deploy ID
    const deployId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Create deployment record in database
    try {
      await axios.post(`${config.mainApiUrl}/api/internal/deployments`, {
        projectId: repoId,
        deployId,
        commitSha,
        branch,
        repoFullName,
        status: 'queued'
      });
      console.log(`✅ Deployment record created: ${deployId}`);
    } catch (error) {
      console.error(`Failed to create deployment record:`, error);
    }
    
    // Queue deployment job
    await addDeploymentJob({
      deploymentId: deployId,
      projectId: repoId,
      repoFullName,
      branch,
      commitSha,
      cloneUrl: payload.repository.clone_url,
      accessToken,
    });
    
    console.log(`✅ Deployment queued: ${deployId}`);
  } else {
    // For non-deploy branches, just clone for analysis
    await addRepoCloneJob({
      repoId,
      repoFullName,
      branch,
      cloneUrl: payload.repository.clone_url,
      commitSha,
      accessToken,
    });
  }

  // Log commit info
  for (const commit of commits) {
    console.log(`  - ${commit.id.substring(0, 7)}: ${commit.message}`);
  }
}

async function handlePullRequestEvent(payload: any, repoId: string, repoFullName: string, accessToken?: string) {
  const action = payload.action;
  const prNumber = payload.pull_request?.number;
  const title = payload.pull_request?.title;
  const branch = payload.pull_request?.head?.ref;
  const commitSha = payload.pull_request?.head?.sha;

  console.log(`🔀 PR #${prNumber} ${action}: ${title}`);

  if (action === 'opened' || action === 'synchronize') {
    // Create preview deployment for PR
    console.log(`🚀 Creating preview deployment for PR #${prNumber}`);
    
    const deployId = `pr-${prNumber}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await addDeploymentJob({
      deploymentId: deployId,
      projectId: repoId,
      repoFullName,
      branch,
      commitSha,
      cloneUrl: payload.repository.clone_url,
      accessToken,
    });
    
    console.log(`✅ PR preview deployment queued: ${deployId}`);
  }
}

async function handleIssuesEvent(payload: any, repoId: string, repoFullName: string) {
  const action = payload.action;
  const issueNumber = payload.issue?.number;
  const title = payload.issue?.title;

  console.log(`📋 Issue #${issueNumber} ${action}: ${title}`);
}

async function handleCommitCommentEvent(payload: any, repoId: string, repoFullName: string) {
  const commitSha = payload.comment?.commit_id;
  const comment = payload.comment?.body;

  console.log(`💬 Comment on commit ${commitSha?.substring(0, 7)}: ${comment?.substring(0, 50)}...`);
}

async function updateEventStatus(eventId: string, status: string, error?: string) {
  try {
    await axios.put(
      `${config.mainApiUrl}/api/webhook/events/${eventId}/status`,
      { status, error }
    );
  } catch (err) {
    console.error('Failed to update event status:', err);
  }
}

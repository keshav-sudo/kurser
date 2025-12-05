import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth.js';
import { Repository } from '../models/Repository.js';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { addRepoCloneJob } from '../config/bullmq.js';

export const getUserRepos = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      params: { per_page: 100, sort: 'updated' }
    });
    
    res.json({ repos: response.data });
  } catch (error: any) {
    console.error('Error fetching repos:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
};

export const getTrackedRepos = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const repos = await Repository.find({ userId: user._id }).sort({ updatedAt: -1 });
    res.json({ repos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tracked repositories' });
  }
};

export const setupWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { repoFullName } = req.body;
    const user = req.user;
    
    if (!repoFullName) {
      return res.status(400).json({ error: 'Repository name required' });
    }
    
    // Check if repo already exists for this user
    const existingRepo = await Repository.findOne({ 
      fullName: repoFullName,
      userId: user._id 
    });
    
    if (existingRepo) {
      return res.status(400).json({ 
        error: 'Webhook already configured for this repository',
        repo: existingRepo
      });
    }
    
    // Get repo details first
    let repoData;
    try {
      const repoResponse = await axios.get(`https://api.github.com/repos/${repoFullName}`, {
        headers: { 
          Authorization: `Bearer ${user.accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      repoData = repoResponse.data;
    } catch (error: any) {
      console.error('Failed to fetch repo details:', error.response?.data);
      return res.status(404).json({ 
        error: 'Repository not found',
        details: 'Make sure the repository name is correct and you have access to it'
      });
    }
    
    // Check if user has admin access
    if (repoData.permissions && !repoData.permissions.admin && !repoData.permissions.push) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        details: 'You need at least write access to this repository to create webhooks'
      });
    }
    
    // Create webhook on GitHub (optional based on PUBLIC_URL)
    const publicUrl = process.env.PUBLIC_URL?.trim();
    const webhookUrl = publicUrl ? `${publicUrl}/webhook` : null;
    
    let webhookId = null;
    let webhookCreated = false;
    
    if (webhookUrl) {
      console.log('🔗 Attempting to create webhook with URL:', webhookUrl);
      try {
        const webhookResponse = await axios.post(
          `https://api.github.com/repos/${repoFullName}/hooks`,
          {
            name: 'web',
            active: true,
            events: ['push', 'pull_request', 'issues', 'commit_comment'],
            config: {
              url: webhookUrl,
              content_type: 'json',
              insecure_ssl: '1' // Allow insecure SSL for local/ngrok testing
            }
          },
          {
            headers: { 
              Authorization: `Bearer ${user.accessToken}`,
              Accept: 'application/vnd.github.v3+json'
            }
          }
        );
        
        webhookId = webhookResponse.data.id.toString();
        webhookCreated = true;
        console.log('✅ Webhook created on GitHub:', webhookId);
      } catch (webhookError: any) {
        console.error('Webhook creation error:', webhookError.response?.data);
        
        // If webhook already exists, try to find it
        if (webhookError.response?.status === 422) {
          try {
            const hooksResponse = await axios.get(
              `https://api.github.com/repos/${repoFullName}/hooks`,
              {
                headers: { 
                  Authorization: `Bearer ${user.accessToken}`,
                  Accept: 'application/vnd.github.v3+json'
                }
              }
            );
            
            const existingHook = hooksResponse.data.find((hook: any) => 
              hook.config?.url === webhookUrl
            );
            
            if (existingHook) {
              webhookId = existingHook.id.toString();
              webhookCreated = true;
              console.log('✅ Using existing webhook:', webhookId);
            }
          } catch (e) {
            console.error('Failed to fetch existing hooks:', e);
          }
        }
        
        // If we still don't have a webhook ID, continue without it
        if (!webhookId) {
          console.log('⚠️ Continuing without webhook creation - PUBLIC_URL not properly configured');
        }
      }
    } else {
      console.log('ℹ️ Skipping webhook creation - PUBLIC_URL not set');
    }
    
    // Save to database
    try {
      const repo = await Repository.create({
        userId: user._id,
        repoId: repoData.id.toString(),
        repoName: repoData.name,
        fullName: repoFullName,
        webhookId: webhookId || 'none',
        webhookUrl: webhookUrl || 'http://localhost:3000/webhook',
        isActive: true
      });
      
      // Update user's repos list
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { repos: repoFullName }
      });
      
      console.log('✅ Repository saved to database');
      
      // Queue initial repository clone job
      try {
        await addRepoCloneJob({
          repoId: repoData.id.toString(),
          repoFullName,
          branch: repoData.default_branch || 'main',
          cloneUrl: repoData.clone_url,
          accessToken: user.accessToken, // Include user's GitHub access token
        });
        console.log('✅ Repository clone job queued');
      } catch (queueError) {
        console.error('⚠️  Failed to queue clone job:', queueError);
      }
      
      res.json({ 
        message: webhookCreated 
          ? 'Webhook configured successfully' 
          : 'Repository tracked (webhook not created - set PUBLIC_URL to enable webhooks)',
        repo,
        webhookCreated,
        warning: !webhookUrl ? 'Set PUBLIC_URL environment variable to enable GitHub webhooks' : null
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      
      // Handle duplicate key error
      if (dbError.code === 11000) {
        return res.status(400).json({ 
          error: 'Repository already tracked',
          details: 'This repository is already being tracked in the system'
        });
      }
      
      throw dbError;
    }
  } catch (error: any) {
    console.error('Webhook setup error:', error);
    res.status(500).json({ 
      error: 'Failed to setup webhook',
      details: error.message || 'An unexpected error occurred'
    });
  }
};

export const removeWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { repoId } = req.params;
    const user = req.user;
    
    // Find by repoId (GitHub ID), not MongoDB _id
    const repo = await Repository.findOne({ repoId, userId: user._id });
    
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    
    // Delete webhook from GitHub
    if (repo.webhookId && repo.webhookId !== 'none') {
      try {
        await axios.delete(
          `https://api.github.com/repos/${repo.fullName}/hooks/${repo.webhookId}`,
          {
            headers: { Authorization: `Bearer ${user.accessToken}` }
          }
        );
        console.log('✅ Webhook deleted from GitHub');
      } catch (error: any) {
        console.error('GitHub webhook deletion error:', error.response?.data || error.message);
      }
    }
    
    // Remove from database using MongoDB _id
    await Repository.findByIdAndDelete(repo._id);
    
    // Update user's repos list
    await User.findByIdAndUpdate(user._id, {
      $pull: { repos: repo.fullName }
    });
    
    console.log(`✅ Repository ${repo.fullName} removed from database`);
    
    res.json({ message: 'Webhook removed successfully' });
  } catch (error) {
    console.error('Remove webhook error:', error);
    res.status(500).json({ error: 'Failed to remove webhook' });
  }
};

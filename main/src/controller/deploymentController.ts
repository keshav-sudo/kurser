import { Request, Response } from 'express';
import { Deployment } from '../models/Deployment.js';
import { Repository } from '../models/Repository.js';
import { addDeploymentJob } from '../config/bullmq.js';
import mongoose from 'mongoose';

class DeploymentController {
  // Create new deployment
  async createDeployment(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { branch, commitSha } = req.body;
      const userId = (req as any).user.userId;

      // Verify project exists and belongs to user
      const project = await Repository.findOne({
        _id: projectId,
        userId
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Generate unique deploy ID (timestamp + short hash)
      const deployId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const azurePath = `projects/${projectId}/deploys/${deployId}`;

      // Create deployment record
      const deployment = await Deployment.create({
        projectId,
        deployId,
        commitSha: commitSha || 'HEAD',
        branch: branch || 'main',
        status: 'queued',
        isLatest: false,
        azurePath,
        previewUrl: `https://${deployId}.${project.domain || 'preview.kurser.app'}`
      });

      // Queue deployment job
      await addDeploymentJob({
        deploymentId: deployment.deployId,
        projectId: projectId,
        repoFullName: project.fullName,
        branch: branch || 'main',
        commitSha: commitSha || 'HEAD',
        cloneUrl: `https://github.com/${project.fullName}.git`,
        buildCommand: project.buildCommand,
        installCommand: project.installCommand,
        buildDir: project.buildDir
      });

      res.status(201).json({
        success: true,
        deployment: {
          id: deployment._id,
          deployId: deployment.deployId,
          status: deployment.status,
          branch: deployment.branch,
          commitSha: deployment.commitSha,
          previewUrl: deployment.previewUrl,
          azurePath: deployment.azurePath,
          createdAt: deployment.createdAt
        }
      });

    } catch (error: any) {
      console.error('Create deployment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all deployments for a project
  async getDeployments(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const userId = (req as any).user.userId;

      // Verify project ownership
      const project = await Repository.findOne({ _id: projectId, userId });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const query: any = { projectId };
      if (status) query.status = status;

      const deployments = await Deployment.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .select('-buildLog -errorLog');

      const total = await Deployment.countDocuments(query);

      res.json({
        success: true,
        deployments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error: any) {
      console.error('Get deployments error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get specific deployment
  async getDeployment(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const userId = (req as any).user.userId;

      const deployment = await Deployment.findOne({ deployId: deploymentId })
        .populate('projectId');

      if (!deployment) {
        return res.status(404).json({ error: 'Deployment not found' });
      }

      // Verify ownership
      const project = deployment.projectId as any;
      if (project.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json({
        success: true,
        deployment
      });

    } catch (error: any) {
      console.error('Get deployment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update deployment (used by worker)
  async updateDeployment(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const updateData = req.body;

      const deployment = await Deployment.findOneAndUpdate(
        { deployId: deploymentId },
        { $set: updateData },
        { new: true }
      );

      if (!deployment) {
        return res.status(404).json({ error: 'Deployment not found' });
      }

      res.json({
        success: true,
        deployment
      });

    } catch (error: any) {
      console.error('Update deployment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Set deployment as latest (promote/rollback)
  async setLatest(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const userId = (req as any).user.userId;

      const deployment = await Deployment.findOne({ deployId: deploymentId })
        .populate('projectId');

      if (!deployment) {
        return res.status(404).json({ error: 'Deployment not found' });
      }

      // Verify ownership
      const project = deployment.projectId as any;
      if (project.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Only allow setting ready deployments as latest
      if (deployment.status !== 'ready') {
        return res.status(400).json({ 
          error: 'Can only promote deployments with "ready" status' 
        });
      }

      // Start transaction to update both deployments atomically
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Unset current latest
        await Deployment.updateMany(
          { projectId: deployment.projectId, isLatest: true },
          { $set: { isLatest: false } },
          { session }
        );

        // Set new latest
        deployment.isLatest = true;
        await deployment.save({ session });

        await session.commitTransaction();

        res.json({
          success: true,
          message: 'Deployment set as latest',
          deployment: {
            deployId: deployment.deployId,
            isLatest: deployment.isLatest,
            previewUrl: deployment.previewUrl
          }
        });

      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

    } catch (error: any) {
      console.error('Set latest error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete deployment
  async deleteDeployment(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const userId = (req as any).user.userId;

      const deployment = await Deployment.findOne({ deployId: deploymentId })
        .populate('projectId');

      if (!deployment) {
        return res.status(404).json({ error: 'Deployment not found' });
      }

      // Verify ownership
      const project = deployment.projectId as any;
      if (project.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Don't allow deleting the latest deployment
      if (deployment.isLatest) {
        return res.status(400).json({ 
          error: 'Cannot delete the current live deployment' 
        });
      }

      await deployment.deleteOne();

      res.json({
        success: true,
        message: 'Deployment deleted successfully'
      });

    } catch (error: any) {
      console.error('Delete deployment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get deployment logs
  async getDeploymentLogs(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const userId = (req as any).user.userId;

      const deployment = await Deployment.findOne({ deployId: deploymentId })
        .populate('projectId')
        .select('buildLog errorLog status projectId');

      if (!deployment) {
        return res.status(404).json({ error: 'Deployment not found' });
      }

      // Verify ownership
      const project = deployment.projectId as any;
      if (project.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json({
        success: true,
        logs: {
          buildLog: deployment.buildLog || '',
          errorLog: deployment.errorLog || '',
          status: deployment.status
        }
      });

    } catch (error: any) {
      console.error('Get logs error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Internal API - Create deployment from worker (no auth required)
  async createDeploymentInternal(req: Request, res: Response) {
    try {
      const { projectId, deployId, commitSha, branch, repoFullName, status } = req.body;

      // Find project
      const project = await Repository.findOne({ repoId: projectId });
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const azurePath = `projects/${projectId}/deploys/${deployId}`;

      // Create deployment record
      const deployment = await Deployment.create({
        projectId: project._id,
        deployId,
        commitSha,
        branch,
        status: status || 'queued',
        isLatest: false,
        azurePath,
        previewUrl: `https://${deployId}.${project.domain || 'preview.example.com'}`
      });

      res.status(201).json({
        success: true,
        deployment: {
          id: deployment._id,
          deployId: deployment.deployId,
          status: deployment.status,
          previewUrl: deployment.previewUrl
        }
      });

    } catch (error: any) {
      console.error('Create internal deployment error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const deploymentController = new DeploymentController();

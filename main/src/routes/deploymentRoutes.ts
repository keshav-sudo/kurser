import express from 'express';
import { deploymentController } from '../controller/deploymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Internal APIs (no auth) - for worker communication
router.post('/internal/deployments', deploymentController.createDeploymentInternal);
router.patch('/deployments/:deploymentId', deploymentController.updateDeployment);

// All other deployment routes require authentication
router.use(authenticate);

// Create new deployment (trigger deploy)
router.post('/projects/:projectId/deploy', deploymentController.createDeployment);

// Get all deployments for a project
router.get('/projects/:projectId/deployments', deploymentController.getDeployments);

// Get specific deployment
router.get('/deployments/:deploymentId', deploymentController.getDeployment);

// Set deployment as latest (rollback/promote)
router.post('/deployments/:deploymentId/set-latest', deploymentController.setLatest);

// Delete deployment
router.delete('/deployments/:deploymentId', deploymentController.deleteDeployment);

// Get deployment logs
router.get('/deployments/:deploymentId/logs', deploymentController.getDeploymentLogs);

export default router;

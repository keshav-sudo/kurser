import { Router } from 'express';
import { getUserRepos, getTrackedRepos, setupWebhook, removeWebhook } from '../controller/repoController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getUserRepos);
router.get('/tracked', authenticate, getTrackedRepos);
router.post('/webhook', authenticate, setupWebhook);
router.delete('/webhook/:repoId', authenticate, removeWebhook);

export default router;

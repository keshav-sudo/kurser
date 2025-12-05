import { Router } from 'express';
import { githubLogin, githubCallback, getProfile } from '../controller/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/profile', authenticate, getProfile);

export default router;

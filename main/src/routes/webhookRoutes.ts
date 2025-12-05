import { Router } from 'express';
import { handleWebhook, getWebhookEvents, updateEventStatus } from '../controller/webhookController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', handleWebhook);
router.get('/events/:repoId', authenticate, getWebhookEvents);
router.patch('/events/:eventId/status', updateEventStatus);

export default router;

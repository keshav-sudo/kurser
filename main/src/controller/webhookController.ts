import { Request, Response } from 'express';
import { Repository } from '../models/Repository.js';
import { User } from '../models/User.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { addWebhookJob } from '../config/bullmq.js';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const eventType = req.headers['x-github-event'] as string;
    const payload = req.body;
    
    if (!eventType || !payload.repository) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    const repoId = payload.repository.id.toString();
    const repoFullName = payload.repository.full_name;
    
    // Check if repo is tracked
    const repo = await Repository.findOne({ repoId });
    
    if (!repo || !repo.isActive) {
      return res.status(404).json({ error: 'Repository not tracked' });
    }
    
    // Get user's access token
    const user = await User.findById(repo.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Save event to database
    const webhookEvent = await WebhookEvent.create({
      repoId,
      eventType,
      eventData: payload,
      status: 'pending'
    });
    
    // Update last webhook event time
    await Repository.findByIdAndUpdate(repo._id, {
      lastWebhookEvent: new Date()
    });
    
    // Publish to BullMQ for worker processing
    await addWebhookJob({
      eventId: webhookEvent._id.toString(),
      event: eventType,
      repoId,
      repoFullName,
      payload,
      accessToken: user.accessToken, // Include user's access token
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Webhook received: ${eventType} for ${repoFullName}`);
    
    res.status(200).json({ 
      message: 'Webhook received',
      eventId: webhookEvent._id
    });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

export const getWebhookEvents = async (req: any, res: Response) => {
  try {
    const { repoId } = req.params;
    const { status, limit = 50 } = req.query;
    
    const query: any = { repoId };
    if (status) {
      query.status = status;
    }
    
    const events = await WebhookEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));
    
    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch webhook events' });
  }
};

export const updateEventStatus = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status, error } = req.body;
    
    const event = await WebhookEvent.findByIdAndUpdate(
      eventId,
      {
        status,
        error,
        processedAt: status === 'completed' || status === 'failed' ? new Date() : undefined
      },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
};

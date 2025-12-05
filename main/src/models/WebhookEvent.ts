import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  repoId: string;
  eventType: string;
  eventData: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  repoId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  eventData: { type: Schema.Types.Mixed, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  error: { type: String },
  processedAt: { type: Date }
}, {
  timestamps: true
});

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

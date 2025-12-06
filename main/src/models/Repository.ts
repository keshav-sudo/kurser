import mongoose, { Schema, Document } from 'mongoose';

export interface IRepository extends Document {
  userId: mongoose.Types.ObjectId;
  repoId: string;
  repoName: string;
  fullName: string;
  webhookId?: string;
  webhookUrl?: string;
  isActive: boolean;
  lastWebhookEvent?: Date;
  domain?: string; // custom domain for the project
  buildCommand?: string; // npm run build, vite build, etc.
  buildDir?: string; // dist, build, out, etc.
  installCommand?: string; // npm install, yarn, pnpm install
  createdAt: Date;
  updatedAt: Date;
}

const RepositorySchema = new Schema<IRepository>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  repoId: { type: String, required: true },
  repoName: { type: String, required: true },
  fullName: { type: String, required: true, unique: true },
  webhookId: { type: String },
  webhookUrl: { type: String },
  isActive: { type: Boolean, default: true },
  lastWebhookEvent: { type: Date },
  domain: { type: String },
  buildCommand: { type: String, default: 'npm run build' },
  buildDir: { type: String, default: 'dist' },
  installCommand: { type: String, default: 'npm install' }
}, {
  timestamps: true
});

export const Repository = mongoose.model<IRepository>('Repository', RepositorySchema);

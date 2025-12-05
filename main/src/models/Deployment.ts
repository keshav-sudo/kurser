import mongoose, { Schema, Document } from 'mongoose';

export interface IDeployment extends Document {
  projectId: mongoose.Types.ObjectId;
  deployId: string; // unique ID for each deploy (timestamp-based or commit-sha)
  commitSha: string;
  branch: string;
  status: 'queued' | 'building' | 'uploading' | 'ready' | 'failed';
  isLatest: boolean; // which deploy is currently live
  previewUrl?: string;
  buildLog?: string;
  errorLog?: string;
  azurePath: string; // projects/{projectId}/deploys/{deployId}
  buildTime?: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema<IDeployment>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
  deployId: { type: String, required: true, unique: true, index: true }, // Add index here
  commitSha: { type: String, required: true },
  branch: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['queued', 'building', 'uploading', 'ready', 'failed'],
    default: 'queued'
  },
  isLatest: { type: Boolean, default: false },
  previewUrl: { type: String },
  buildLog: { type: String },
  errorLog: { type: String },
  azurePath: { type: String, required: true },
  buildTime: { type: Number }
}, {
  timestamps: true
});

// Index for faster queries (only one index per field)
DeploymentSchema.index({ projectId: 1, isLatest: 1 });

export const Deployment = mongoose.model<IDeployment>('Deployment', DeploymentSchema);

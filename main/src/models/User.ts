import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  githubId: string;
  username: string;
  email?: string;
  accessToken: string;
  avatarUrl?: string;
  repos: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String },
  accessToken: { type: String, required: true },
  avatarUrl: { type: String },
  repos: [{ type: String }],
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);

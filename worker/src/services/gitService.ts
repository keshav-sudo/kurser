import simpleGit, { SimpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config/env';

export class GitService {
  private git: SimpleGit;
  private repoPath: string;
  private accessToken?: string;

  constructor(repoFullName: string, accessToken?: string) {
    this.repoPath = path.join(config.cloneDir, repoFullName);
    this.git = simpleGit();
    this.accessToken = accessToken;
  }

  async cloneOrPull(repoUrl: string): Promise<string> {
    try {
      // Ensure base directory exists
      await fs.mkdir(config.cloneDir, { recursive: true });

      // Add GitHub token to URL if available
      let authenticatedUrl = repoUrl;
      const token = this.accessToken || config.github.token;
      if (token) {
        authenticatedUrl = repoUrl.replace(
          'https://github.com/',
          `https://${token}@github.com/`
        );
      }

      // Check if repo already exists
      const exists = await this.repoExists();

      if (exists) {
        console.log(`📥 Pulling latest changes for ${this.repoPath}`);
        const git = simpleGit(this.repoPath);
        await git.pull();
      } else {
        console.log(`📦 Cloning repository to ${this.repoPath}`);
        await this.git.clone(authenticatedUrl, this.repoPath, {
          '--depth': 1, // Shallow clone for efficiency
        });
      }

      return this.repoPath;
    } catch (error) {
      console.error('Git operation failed:', error);
      throw error;
    }
  }

  async checkout(branch: string): Promise<void> {
    const git = simpleGit(this.repoPath);
    await git.checkout(branch);
  }

  async getLatestCommit(): Promise<any> {
    const git = simpleGit(this.repoPath);
    const log = await git.log({ maxCount: 1 });
    return log.latest;
  }

  async getBranches(): Promise<string[]> {
    const git = simpleGit(this.repoPath);
    const branches = await git.branch();
    return branches.all;
  }

  async getFileContent(filePath: string): Promise<string> {
    const fullPath = path.join(this.repoPath, filePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  async listFiles(directory: string = ''): Promise<string[]> {
    const fullPath = path.join(this.repoPath, directory);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files: string[] = [];
    for (const entry of entries) {
      const relativePath = path.join(directory, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const subFiles = await this.listFiles(relativePath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
    
    return files;
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.repoPath, { recursive: true, force: true });
      console.log(`🧹 Cleaned up ${this.repoPath}`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  private async repoExists(): Promise<boolean> {
    try {
      await fs.access(path.join(this.repoPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  getRepoPath(): string {
    return this.repoPath;
  }
}

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config/env';

export interface UploadResult {
  success: boolean;
  azurePath: string;
  fileCount: number;
  error?: string;
}

export class AzureBlobService {
  private containerClient: ContainerClient;
  private containerName: string = '$web'; // Use $web for static website hosting

  constructor() {
    const connectionString = config.azure.storageConnectionString;
    if (!connectionString) {
      throw new Error('Azure Storage connection string not configured');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * Upload entire build directory to Azure Blob
   * Structure: username/repo-name/deploy-id/*
   */
  async uploadBuild(
    buildDir: string,
    projectId: string,
    deployId: string
  ): Promise<UploadResult> {
    try {
      // Parse projectId as username/repo-name or use as-is
      const azurePath = `${projectId}/${deployId}`;
      console.log(`☁️  Uploading build to Azure: ${azurePath}`);

      // Ensure container exists
      await this.ensureContainer();

      const files = await this.getAllFiles(buildDir);
      
      let uploadedCount = 0;

      // Upload each file
      for (const file of files) {
        const relativePath = path.relative(buildDir, file);
        const blobName = `${azurePath}/${relativePath}`.replace(/\\/g, '/');
        
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        
        // Detect content type
        const contentType = this.getContentType(file);
        
        await blockBlobClient.uploadFile(file, {
          blobHTTPHeaders: { blobContentType: contentType }
        });
        
        uploadedCount++;
        
        if (uploadedCount % 10 === 0) {
          console.log(`  📤 Uploaded ${uploadedCount}/${files.length} files`);
        }
      }

      console.log(`✅ Upload complete: ${uploadedCount} files`);

      return {
        success: true,
        azurePath,
        fileCount: uploadedCount
      };

    } catch (error: any) {
      console.error('❌ Azure upload failed:', error);
      return {
        success: false,
        azurePath: '',
        fileCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Delete a specific deployment
   */
  async deleteDeployment(projectId: string, deployId: string): Promise<boolean> {
    try {
      const prefix = `${projectId}/${deployId}/`;
      
      let deletedCount = 0;
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        await this.containerClient.deleteBlob(blob.name);
        deletedCount++;
      }

      console.log(`🗑️  Deleted ${deletedCount} files for deploy ${deployId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete deployment:', error);
      return false;
    }
  }

  /**
   * List all deployments for a project
   */
  async listDeployments(projectId: string): Promise<string[]> {
    const prefix = `${projectId}/`;
    const deployIds = new Set<string>();

    try {
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        // Extract deployId from path: username/repo-name/deploy-id/...
        const parts = blob.name.split('/');
        if (parts.length >= 3) {
          deployIds.add(parts[2]);
        }
      }

      return Array.from(deployIds);
    } catch (error) {
      console.error('Failed to list deployments:', error);
      return [];
    }
  }

  private async ensureContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob' // public read access for blobs
      });
    } catch (error) {
      console.error('Container creation/check failed:', error);
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.txt': 'text/plain',
      '.xml': 'application/xml',
      '.pdf': 'application/pdf',
      '.wasm': 'application/wasm'
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}

import { QueueClient, QueueServiceClient } from '@azure/storage-queue';
import { config } from '../config/env';

export class AzureQueueService {
  private queueClient: QueueClient | null = null;
  private isEnabled: boolean = false;

  constructor(queueName: string) {
    if (config.azure.connectionString) {
      try {
        const queueServiceClient = QueueServiceClient.fromConnectionString(
          config.azure.connectionString
        );
        this.queueClient = queueServiceClient.getQueueClient(queueName);
        this.isEnabled = true;
        console.log(`✅ Azure Queue initialized: ${queueName}`);
      } catch (error) {
        console.error('❌ Failed to initialize Azure Queue:', error);
      }
    }
  }

  async createQueue(): Promise<void> {
    if (!this.isEnabled || !this.queueClient) return;
    
    try {
      await this.queueClient.create();
      console.log('✅ Azure Queue created');
    } catch (error: any) {
      if (error.statusCode === 409) {
        console.log('ℹ️  Queue already exists');
      } else {
        throw error;
      }
    }
  }

  async sendMessage(message: any): Promise<void> {
    if (!this.isEnabled || !this.queueClient) {
      console.log('⚠️  Azure Queue not enabled, skipping message');
      return;
    }

    try {
      const messageText = JSON.stringify(message);
      await this.queueClient.sendMessage(Buffer.from(messageText).toString('base64'));
      console.log('📤 Message sent to Azure Queue');
    } catch (error) {
      console.error('❌ Failed to send message to Azure Queue:', error);
      throw error;
    }
  }

  async receiveMessages(maxMessages: number = 10): Promise<any[]> {
    if (!this.isEnabled || !this.queueClient) {
      return [];
    }

    try {
      const response = await this.queueClient.receiveMessages({
        numberOfMessages: maxMessages,
        visibilityTimeout: 300, // 5 minutes
      });

      return response.receivedMessageItems.map((item) => {
        const messageText = Buffer.from(item.messageText, 'base64').toString('utf-8');
        return {
          id: item.messageId,
          popReceipt: item.popReceipt,
          data: JSON.parse(messageText),
        };
      });
    } catch (error) {
      console.error('❌ Failed to receive messages:', error);
      return [];
    }
  }

  async deleteMessage(messageId: string, popReceipt: string): Promise<void> {
    if (!this.isEnabled || !this.queueClient) return;

    try {
      await this.queueClient.deleteMessage(messageId, popReceipt);
      console.log('✅ Message deleted from Azure Queue');
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
    }
  }

  isQueueEnabled(): boolean {
    return this.isEnabled;
  }
}

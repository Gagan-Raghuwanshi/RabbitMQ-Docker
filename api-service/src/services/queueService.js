const amqplib = require('amqplib');

class QueueService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.queues = new Set();
  }

  async connect() {
    try {
      if (this.isConnected) {
        console.log('Queue service already connected');
        return;
      }

      console.log('Connecting to RabbitMQ...', process.env.RABBITMQ_URL);

      this.connection = await amqplib.connect(process.env.RABBITMQ_URL, {
        heartbeat: 60,
        timeout: 10000,
      });

      this.channel = await this.createChannel();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('RabbitMQ connected successfully');

      this.connection.on('error', (error) => {
        console.log('RabbitMQ connection error:', error);
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.handleConnectionError();
      });

    } catch (error) {
      console.log('Failed to connect to RabbitMQ:', error);
      this.handleConnectionError();
      throw error;
    }
  }

  async createChannel() {
    try {
      const channel = await this.connection.createChannel();
      await channel.prefetch(1);

      channel.on('error', (error) => console.log('RabbitMQ channel error:', error));
      channel.on('close', () => console.log('RabbitMQ channel closed'));

      return channel;
    } catch (error) {
      console.log('Failed to create channel:', error);
      throw error;
    }
  }

  handleConnectionError() {
    this.isConnected = false;
    this.connection = null;
    this.channel = null;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch((error) => console.log('Reconnection attempt failed:', error));
      }, delay);
    } else {
      console.log('Max reconnection attempts reached. Queue service will not reconnect automatically.');
    }
  }

  async ensureConnection() {
    if (!this.isConnected || !this.channel) await this.connect();
  }

  async assertQueue(queueName, options = {}) {
    try {
      await this.ensureConnection();
      const queueOptions = { durable: true, ...options };
      await this.channel.assertQueue(queueName, queueOptions);
      this.queues.add(queueName);
      console.log('Queue asserted:', queueName);
      return queueName;
    } catch (error) {
      console.log('Failed to assert queue:', queueName, error);
      throw error;
    }
  }

  async publish(queueName, message, options = {}) {
    try {
      await this.ensureConnection();
      await this.assertQueue(queueName);

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions = { persistent: true, ...options };

      const success = this.channel.sendToQueue(queueName, messageBuffer, publishOptions);
      console.log('Message published:', queueName);
      return success;
    } catch (error) {
      console.log('Failed to publish message:', queueName, error);
      throw error;
    }
  }

  async consume(queueName, onMessage, options = {}) {
    try {
      await this.ensureConnection();
      await this.assertQueue(queueName);

      const consumeOptions = { noAck: false, ...options };

      this.channel.consume(queueName, async (message) => {
        if (!message) return;
        try {
          const content = JSON.parse(message.content.toString());
          await onMessage(content, message);
          this.channel.ack(message);
          console.log('Message processed:', queueName);
        } catch (error) {
          console.log('Error processing message:', queueName, error);
          this.channel.nack(message, false, true);
        }
      }, consumeOptions);

      console.log('Started consuming:', queueName);

    } catch (error) {
      console.log('Failed to start consuming:', queueName, error);
      throw error;
    }
  }

  async getQueueStatus(queueName) {
    try {
      await this.ensureConnection();
      const queueInfo = await this.channel.checkQueue(queueName);
      return {
        exists: true,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      };
    } catch (error) {
      return { exists: false };
    }
  }

  async purgeQueue(queueName) {
    try {
      await this.ensureConnection();
      await this.channel.purgeQueue(queueName);
      console.log('Queue purged:', queueName);
    } catch (error) {
      console.log('Failed to purge queue:', queueName, error);
      throw error;
    }
  }

  async deleteQueue(queueName) {
    try {
      await this.ensureConnection();
      await this.channel.deleteQueue(queueName);
      this.queues.delete(queueName);
      console.log('Queue deleted:', queueName);
    } catch (error) {
      console.log('Failed to delete queue:', queueName, error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isConnected = false;
      console.log('RabbitMQ connection closed gracefully');
    } catch (error) {
      console.log('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queues: Array.from(this.queues),
      connectionState: this.connection ? 'connected' : 'disconnected',
      channelState: this.channel ? 'open' : 'closed'
    };
  }
}

const queueService = new QueueService();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queue service...');
  try { await queueService.close(); } catch (error) { console.log('Error closing queue service during shutdown:', error); }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing queue service...');
  try { await queueService.close(); } catch (error) { console.log('Error closing queue service during shutdown:', error); }
});

module.exports = queueService;

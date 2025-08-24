const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
  }

  async connect() {
    try {
      if (this.isConnected && this.client) {
        console.log('Redis already connected');
        return;
      }

      console.log('Connecting to Redis...', { url: process.env.REDIS_URL });

      this.client = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              console.error('Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (error) => {
        console.error('Redis client error:', error);
        this.handleConnectionError();
      });

      this.client.on('connect', () => {
        console.log('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('Redis connected successfully');
      });

      this.client.on('end', () => {
        console.warn('Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });

      await this.client.connect();

    } catch (error) {
      console.error('Failed to connect to Redis:', {
        error: error.message,
        stack: error.stack
      });
      this.handleConnectionError();
      throw error;
    }
  }

  handleConnectionError() {
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Attempting Redis reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Redis reconnection attempt failed:', error);
        });
      }, delay);
    } else {
      console.error('Max Redis reconnection attempts reached. Cache service will not reconnect automatically.');
    }
  }

  async ensureConnection() {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }
  }

  async get(key) {
    try {
      await this.ensureConnection();
      const value = await this.client.get(key);

      if (value) {
        try {
          const parsedValue = JSON.parse(value);
          console.log('Cache hit', { key });
          return parsedValue;
        } catch {
          console.warn('Failed to parse cached value, returning raw value', { key });
          return value;
        }
      }

      console.log('Cache miss', { key });
      return null;
    } catch (error) {
      console.error('Error getting from cache:', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, expiration = 300) {
    try {
      await this.ensureConnection();
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (expiration > 0) {
        await this.client.setEx(key, expiration, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }

      console.log('Cache set', { key, expiration });
    } catch (error) {
      console.error('Error setting cache:', { key, error: error.message });
    }
  }

  async del(key) {
    try {
      await this.ensureConnection();
      await this.client.del(key);
      console.log('Cache deleted', { key });
    } catch (error) {
      console.error('Error deleting from cache:', { key, error: error.message });
    }
  }

  async exists(key) {
    try {
      await this.ensureConnection();
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Error checking cache existence:', { key, error: error.message });
      return false;
    }
  }

  async incr(key) {
    try {
      await this.ensureConnection();
      return await this.client.incr(key);
    } catch (error) {
      console.error('Error incrementing cache value:', { key, error: error.message });
      return null;
    }
  }

  async decr(key) {
    try {
      await this.ensureConnection();
      return await this.client.decr(key);
    } catch (error) {
      console.error('Error decrementing cache value:', { key, error: error.message });
      return null;
    }
  }

  async expire(key, seconds) {
    try {
      await this.ensureConnection();
      await this.client.expire(key, seconds);
      console.log('Cache expiration set', { key, seconds });
    } catch (error) {
      console.error('Error setting cache expiration:', { key, error: error.message });
    }
  }

  async ttl(key) {
    try {
      await this.ensureConnection();
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Error getting cache TTL:', { key, error: error.message });
      return -2;
    }
  }

  async keys(pattern = '*') {
    try {
      await this.ensureConnection();
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Error getting cache keys:', { pattern, error: error.message });
      return [];
    }
  }

  async flushAll() {
    try {
      await this.ensureConnection();
      await this.client.flushAll();
      console.log('Cache flushed successfully');
    } catch (error) {
      console.error('Error flushing cache:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        console.log('Redis connection closed gracefully');
      }
    } catch (error) {
      console.error('Error closing Redis connection:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected || !this.client) {
        return { status: 'disconnected', message: 'Redis not connected' };
      }

      await this.client.ping();
      return {
        status: 'connected',
        message: 'Redis is responsive',
        details: this.getStatus()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Redis health check failed',
        error: error.message
      };
    }
  }

  generateKey(prefix, id) {
    return `${prefix}:${id}`;
  }

  getDataKey(id) {
    return this.generateKey('data', id);
  }

  getUserKey(id) {
    return this.generateKey('user', id);
  }

  getSessionKey(token) {
    return this.generateKey('session', token);
  }

  async getWithKey(prefix, id) {
    return this.get(this.generateKey(prefix, id));
  }

  async setWithKey(prefix, id, value, expiration = 300) {
    return this.set(this.generateKey(prefix, id), value, expiration);
  }

  async delWithKey(prefix, id) {
    return this.del(this.generateKey(prefix, id));
  }
}

const cacheService = new CacheService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing cache service...');
  try {
    await cacheService.close();
  } catch (error) {
    console.error('Error closing cache service during shutdown:', error);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing cache service...');
  try {
    await cacheService.close();
  } catch (error) {
    console.error('Error closing cache service during shutdown:', error);
  }
});

module.exports = cacheService;

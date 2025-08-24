const redis = require('redis');

let client;

const connectRedis = async () => {
  client = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  });

  client.on('error', (err) => console.error('Redis Client Error', err));
  
  await client.connect();
  console.log('Connected to Redis');
};

const getCachedData = async (key) => {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

const setCachedData = async (key, data, expireTime = 300) => {
  try {
    await client.setEx(key, expireTime, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting cached data:', error);
  }
};

module.exports = {
  connectRedis,
  getCachedData,
  setCachedData
};



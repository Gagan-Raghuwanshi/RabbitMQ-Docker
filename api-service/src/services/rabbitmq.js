const amqp = require('amqplib');

let channel;
const queueName = 'welcome_queue';

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(
      `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`
    );
    channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
};

const publishMessage = async (queue, message) => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }
    
    await channel.sendToQueue(
      queue, 
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log('Message published to queue:', queue);
  } catch (error) {
    console.error('Error publishing message:', error);
    throw error;
  }
};

module.exports = {
  connectRabbitMQ,
  publishMessage
};



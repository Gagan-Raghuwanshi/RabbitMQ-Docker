const amqp = require('amqplib');
require('dotenv').config();

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    return { connection, channel };
  } catch (err) {
    console.error("RabbitMQ connection failed:", err.message);
    setTimeout(connectRabbitMQ, 5000); // retry
  }
}

module.exports = connectRabbitMQ;

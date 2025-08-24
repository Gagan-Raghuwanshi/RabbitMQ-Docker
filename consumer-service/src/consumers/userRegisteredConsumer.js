const connectRabbitMQ = require('../config/rabbitmq');
const { sendWelcomeEmail } = require('../services/emailService');

async function startUserRegisteredConsumer() {
  const { channel } = await connectRabbitMQ();
  const queueName = process.env.QUEUE_USER_REGISTERED;

  await channel.assertQueue(queueName, { durable: true });
  console.log(`Consumer listening on queue: ${queueName}`);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    try {
      const userData = JSON.parse(msg.content.toString());
      await sendWelcomeEmail(userData);
      channel.ack(msg);
    } catch (err) {
      console.error("Failed to process message:", err);
      channel.nack(msg);
    }
  });
}

module.exports = startUserRegisteredConsumer;

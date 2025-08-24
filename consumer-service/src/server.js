require('dotenv').config();
const startUserRegisteredConsumer = require('./consumers/userRegisteredConsumer');

startUserRegisteredConsumer().catch(console.error);

process.on("SIGINT", () => {
  console.log("Shutting down consumer...");
  process.exit(0);
});

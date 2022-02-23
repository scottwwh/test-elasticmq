const config = require('./src/config');
const ClientApp = require('./src/ClientApp');

(async () => {
  try {
    const client = new ClientApp(config);
    await client.init();
    client.sendMessages();
  } catch (err) {
    console.log('Could not initialize ClientApp:', err);
  }
})();
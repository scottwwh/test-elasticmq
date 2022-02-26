
// SQS
const config = require('./src/config');
const ClientApp = require('./src/ClientApp');
const client = new ClientApp(config);

// App
const fs = require('fs');
const Koa = require('koa');
const serve = require('koa-static')
const router = require('@koa/router')();
const app = new Koa();
app.use(serve('./swap'));

router.get('/', list)
  .get('/api/user/:id', user)
  .get('/api/notification/:id', notification)

// Responses
async function list(ctx) {
  ctx.response.type = 'html';
  ctx.response.body = fs.readFileSync('./src/index.html');
};

async function user(ctx) {
  const id = ctx.params.id;
  try {
    await client.addUser(id);
    ctx.response.body = "ACK";
  } catch (err) {
    console.log(err);
    ctx.response.body = "NOK";
  }
};

async function notification(ctx) {
  try {
    if (ctx.params && ctx.params.id) {
      await client.sendMessage(ctx.params.id);
    } else {
      // Was used by /api/notification
      //
      // Does not work because it doesn't match the URL anymore
      // await client.sendMessages();
    }

    ctx.response.body = "ACK";
  } catch (err) {
    console.log(err);
    ctx.response.body = "NOK";
  }
};

app.use(router.routes());
app.listen(3000);


(async () => {
  try {
    await client.init();
  } catch (err) {
    console.log('Could not initialize ClientApp:', err);
  }
})();
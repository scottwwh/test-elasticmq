
// SQS
const config = require('./config');
const ServiceApp = require('./ServiceApp');
const service = new ServiceApp(config);

// App
const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const serve = require('koa-static')
const bodyParser = require('koa-bodyparser');
const router = require('@koa/router')();

const webRoot = path.join(__dirname, '..', config.WEB_PUBLIC);
const app = new Koa();
app.use(bodyParser());
app.use(serve(webRoot));

router.get('/', list)
  // Users
  .post('/api/users/', addUser)
  .get('/api/users/', getAllUsers)
  .get('/api/users/:id', getUser)
  // Notifications
  .get('/api/notifications/:id', sendNotification)
  .patch('/api/notifications/:id', updateNotifications)

// Display home page
async function list(ctx) {
  const file = path.join(webRoot, 'index.html')
  ctx.response.type = 'html';
  ctx.response.body = fs.readFileSync(file);
};

// Get data for specific user
async function getUser(ctx) {
  const id = ctx.params.id;
  try {
    const data = await service.getUser(id);
    ctx.response.body = data;
  } catch (err) {
    console.log(err);
    ctx.response.body = "NOK";
  }
};

// Get list of all users
async function getAllUsers(ctx) {
  try {
    const users = await service.getAllUsers();
    ctx.response.body = users;
  } catch (err) {
    console.log(err);
    ctx.response.body = "NOK";
  }
};

// TBD: Is this clean enough to stay here?
async function addUser(ctx) {
  const name = ctx.request.body.name;

  try {
    const uuid = await service.addUser(name);
    ctx.response.body = {
      status: "ACK",
      id: uuid
    };
  } catch (err) {
    console.log(err);
    ctx.response.body = {
      status: "NOK"
    };
  }
};

async function sendNotification(ctx) {
  try {
    if (ctx.params && ctx.params.id) {
      await service.sendNotification(ctx.params.id);
    }

    ctx.response.body = "ACK";
  } catch (err) {
    console.log(err);
    ctx.response.body = "NOK";
  }
};

// Set notifications to 0
async function updateNotifications(ctx) {
  try {
    let data = [];
    if (ctx.params && ctx.params.id) {
      const ids = ctx.params.id.split(',');
      for (var i = 0; i < ids.length; i++) {
        const res = await service.updateNotifications(ids[i]);
        data.push(res);
      }
    }

    ctx.response.body = {
      status: "ACK",
      notifications: data
    };
  } catch (err) {
    console.log(err);
    ctx.response.body = "NOK";
  }
};

app.use(router.routes());
app.listen(3000);


(async () => {
  try {
    await service.init();
  } catch (err) {
    console.log('Could not initialize ServiceApp:', err);
  }
})();
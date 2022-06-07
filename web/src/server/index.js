
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
// TODO: Move to ServiceApp
async function getUser(ctx) {
  const id = ctx.params.id;
  try {
    ctx.response.body = "ACK";
    const userDataFile = path.join(__dirname, '..', config.DATA, '/', `${id}.json`);
    const userData = fs.readFileSync(userDataFile, { encoding: 'utf-8' });
    console.log(userData);
    ctx.response.body = JSON.parse(userData);

  } catch (err) {
    console.log(err);
    ctx.response.body = "NOK";
  }
};

// TODO: Move to ServiceApp
async function getAllUsers(ctx) {
  const dataRoot = path.join(__dirname, '..', config.DATA);

  // Strip .json extension to leave just the GUID
  const dir = fs.readdirSync(dataRoot)
    .filter(file => {return file.indexOf('.json') > -1})
    .map(file => file.split('.')[0]);

  try {
    ctx.response.body = dir;
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
    ctx.response.body = "NOK";
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

async function updateNotifications(ctx) {
  try {
    let data = {};
    if (ctx.params && ctx.params.id) {
      
      // Set notifications to 0
      data = await service.updateNotifications(ctx.params.id);
    }

    ctx.response.body = {
      status: "ACK",
      notifications: data.notifications
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
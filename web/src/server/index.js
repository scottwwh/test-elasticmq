
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
  .get('/api/users/', getAllUsers)
  .post('/api/users/', addUser)
  .get('/api/users/:id', getUser)
  .delete('/api/users/:id', removeUser)
  .post('/api/users/:id/messages', sendMessage)

  // Notifications
  //
  // TODO: Change this to post?
  .get('/api/notifications/', getNotifications)
  .delete('/api/notifications/:ids', clearNotifications)

// Display home page
async function list(ctx) {
  const file = path.join(webRoot, 'index.html')
  ctx.response.type = 'html';
  ctx.response.body = fs.readFileSync(file);
};


/**
 * Users
 */

// TBD: Is this clean enough to stay here?
async function addUser(ctx) {
  const name = ctx.request.body.name;

  try {
    const user = await service.addUser(name);
    ctx.response.body = {
      status: "ACK",
      data: user
    };
  } catch (err) {
    console.log(err);
    ctx.response.body = {
      status: "NOK"
    };
  }
};

async function removeUser(ctx) {
  const id = ctx.params.id;
  try {
    Notifications.clear(id, true);
    const data = await service.removeUser(id);    
    ctx.response.body = { status: 'ACK' };
  } catch (err) {
    console.log(err);
    ctx.response.body = { status: "NOK" };
  }
}

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

// TODO: Adapt this to expect a pair of UUIDs
async function sendMessage(ctx) {
  try {
    const body = ctx.request.body;
    if (ctx.params && ctx.params.id && ctx.request.body) {

      // TODO: Push to MQ to pre-generate JSON
      notificationsHistory.push(body);

      await service.sendMessage(ctx.params.id, ctx.request.body);
    }

    ctx.response.body = "ACK";
  } catch (err) {
    console.log(err);
    ctx.response.body = "NOK";
  }
};


/**
 * Notifications
 */

let notificationsHistory = [];

class Notifications {

  // Current case is that clearing notifications is one or all
  static clear(ids, sourceAndTarget = false) {
    ids = Array.isArray(ids) ? ids : [ids] ;
    console.log('Clear notifications for IDs:', ids);

    if (ids.length === 1) {
      
      // Filter out any effected IDs
      notificationsHistory = notificationsHistory.filter(el => {
        if (sourceAndTarget) {
          return (el.target !== ids[0] && el.source !== ids[0]);
        } else {
          return el.target !== ids[0];
        }
      });
    } else {
      notificationsHistory = [];
    }
  }
}

// Load initial notification data for D3 (until it is cached)
async function getNotifications(ctx) {
  ctx.response.body = {
    status: "ACK",
    notifications: notificationsHistory
  };
}

// Set notifications to 0
async function clearNotifications(ctx) {
  try {
    let data = [];
    if (ctx.params && ctx.params.ids) {
      const ids = ctx.params.ids.split(',');
      Notifications.clear(ids);

      // Clear notifications for all identified IDs
      for (var i = 0; i < ids.length; i++) {
        const res = await service.clearNotifications(ids[i]);
        data.push(res);
      }
    }

    ctx.response.body = {
      status: "ACK",
      notifications: data
    };
  } catch (err) {
    console.log(err);
    ctx.response.body = {
      status: "NOK"
    };
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
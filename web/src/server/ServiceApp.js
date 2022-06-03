// Assumes TypeScript
// import { SQS } from 'aws-sdk';

// Not really necessary at the moment, but good to keep around
const { SQS } = require('aws-sdk');

// const config = require('./src/config');
const Message = require('./Message');

// Set up a producer: https://www.npmjs.com/package/sqs-producer
const { Producer } = require('sqs-producer');
// const { Consumer } = require('sqs-consumer');
const BaseConsumer = require('./BaseConsumer');


// WebSockets for async updates
// Ref: https://ably.com/blog/web-app-websockets-nodejs
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');


//-- Web sockets --//


const wss = new WebSocket.Server({ port: 7071 });
const clients = new Map();

wss.on('connection', (ws) => {
    const uuid = crypto.randomUUID();
    const color = Math.floor(Math.random() * 360);
    const metadata = { uuid, color };

    clients.set(ws, metadata);

    // Relay messages from any client (not exactly what I need?)
    ws.on('message', (messageAsString) => {
        const message = JSON.parse(messageAsString);
        const metadata = clients.get(ws);

        message.sender = metadata.id;
        message.color = metadata.color;

        wsBroadcastMessage(message);
    });

    ws.on("close", () => {
        clients.delete(ws);
    });

    const foo = {
        status: "INITIALIZED BABY!!!",
        uuid
    };
    wsBroadcastMessage(foo);

    // TODO: Clear the interval if connection is closed (currently causing a cascade of overlapping messages in the beginning)
    let i = 0;
    let interval = setInterval(() => {
        i++;
        if (i <= 10) {
            const data = {
                status: `Still running`,
                number: i
            }
            wsBroadcastMessage(data);
        } else {
            clearInterval(interval);
            i = 0;
        }
    }, 500);
});

function wsBroadcastMessage(data) {
    const message = JSON.stringify(data);

    [...clients.keys()].forEach((client) => {
        client.send(message);
    });
}

console.log("wss up");


//-- App --//


class ServiceApp {
    constructor(config) {
        this.config = config;
        this.cdnRoot = path.join(__dirname, '..', this.config.WEB_CDN);
    }

    async init() {
        console.log(this.config);

        // this.queue = new SQS({
        //     endpoint: this.config.QUEUE_BASE_URL,
        //     region: this.config.ZONE, // This does not matter
        // });
        
        // const queues = await this.queue.listQueues().promise();
        // console.log(queues);

        // Create producers
        this.notificationRequests = Producer.create({
            queueUrl: this.config.QUEUE_FULL_URL + this.config.QUEUE_NOTIFICATIONS_REQUESTS,
            region: this.config.ZONE
        });

        this.notificationResponses = new BaseConsumer(
            this.config,
            this.config.QUEUE_NOTIFICATIONS_RESPONSES,
            msg => { this.notificationHandler(msg); }
        );
        this.notificationResponses.start();

        // this.users = Producer.create({
        //     queueUrl: this.config.QUEUE_FULL_URL + this.config.QUEUE_USERS,
        //     region: this.config.ZONE
        // });
    }

    notificationHandler(msg) {
        if (msg.Body) {
            console.log('Handle message', msg);

            try {
                wsBroadcastMessage({ type: 'notification', id: msg.Body });
        
            } catch(err) {
                // TODO: Obviously not ready for primetime
                console.error(err)
            }

            Promise.resolve(true);
        } else {
            console.log('Invalid content:', msg);

            // Messages don't seem to be cleared out with Promise.reject or errors, so use this
            Promise.resolve(false);
        }

    }

    async addUser(name) {
        const payload = {
            id: crypto.randomUUID(),
            name,
            notifications: 0
        };

        const user = payload.id;
        const path = this.cdnRoot + `${user}.json`;

        // TODO: Check to verify whether user has already been created,
        // and make sure that front-end is not trying to create the user again!
        try {
            fs.writeFileSync(path, JSON.stringify(payload), { encoding: 'utf-8'});
            return user;
        } catch(err) {
            console.error(err)
        }

        // TODO: Remove users queue from ElasticMQ because we're not using this anymore!
        //
        // const payload = JSON.parse(message.Body);
        // Commenting out MQ for user creation for the moment
        // const params = {
        //     id: 'message' + id, // Assume this could be a rootId?
        //     body: JSON.stringify(payload)
        // };
        //
        // const messages = [params];
        // await this.users.send(messages);
    }

    async sendMessage(id) {
        const messages = [];
        const params = {
            id: 'message' + id, // Assume this could be a rootId?
            body: `${id}`,

            // Causes an exception?
            // messageAttributes: {
            //   attr1: { DataType: 'Boolean', BooleanValue: valid }
            // }
        };

        // Throws an exception when pushed into the queue
        // const message = new Message(params);

        messages.push(params);

        await this.notificationRequests.send(messages);
    }

    async sendMessages() {
        
        // Send a message to the queue with a specific ID (by default the body is used as the ID)
        const messages = [];
        const max = Math.floor(Math.random() * 10) + 1;
        for (var i = 0; i < max; i++) {
            await this.sendMessage(i);
        }

        // Get the current size of the queue
        // const size = await this.notificationRequests.queueSize();
        // console.log(`There are currently ${size} messages on the queue.`);
    }
}

module.exports = ServiceApp;
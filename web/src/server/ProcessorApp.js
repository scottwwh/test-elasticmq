const fs = require('fs');
const path = require('path');

// https://www.npmjs.com/package/sqs-consumer
const { Consumer } = require('sqs-consumer');
// const { Producer } = require('sqs-producer');

class ProcessorApp {
    constructor(config) {
        this.config = config;
        this.cdnRoot = path.join(__dirname, '..', this.config.WEB_CDN);

        this.users = this.createConsumer(config, config.QUEUE_USERS, msg => { this.userHandler(msg) });
        this.users.start();

        this.notifications = this.createConsumer(config, config.QUEUE_NOTIFICATIONS, msg => { this.notificationHandler(msg); });
        this.notifications.start();
        
        console.log('Consumer initialized!');
    }

    createConsumer(config, queue, handler) {
        // console.log(config, queue);
        const consumer = Consumer.create({
            queueUrl: config.QUEUE_FULL_URL + queue,
            handleMessage: handler
        });
            
        consumer.on('error', (err) => {
            console.error(err.message);
        });
        
        consumer.on('processing_error', (err) => {
            console.error(err.message);
        });

        consumer.on('empty', (err) => {
            console.error("Queue is empty!");
        });

        return consumer;
    }

    // TODO: Remove this since we're assuming synchronous CRUD operations
    async userHandler(message) {
        if (message.Body) {
            console.log('Create new user:', message.MessageId, '/', message.Body);
            // console.log(this.config);

            const payload = JSON.parse(message.Body);
            const user = payload.id;
            const path = this.cdnRoot + `${user}.json`;
            // const notifications = "0";
            try {
                fs.writeFileSync(path, message.Body, { encoding: 'utf-8'});
            } catch(err) {
                console.error(err)
            }

            Promise.resolve(true);
        } else {
            console.log('Invalid content:', message);

            // Messages don't seem to be cleared out with Promise.reject or errors, so use this
            Promise.resolve(false);
        }
    }

    async notificationHandler(message) {
        if (message.Body) {
            console.log('Processed ' + message.MessageId, '/', message.Body);
            // console.log('Processed message: ' + JSON.stringify(message));

            const user = message.Body;
            const path = this.cdnRoot + `${user}.json`;
            try {
                const payload = fs.readFileSync(path, { encoding: 'utf-8'});
                const data = JSON.parse(payload);
                data.notifications += 1;
                fs.writeFileSync(path, JSON.stringify(data), { encoding: 'utf-8'});
            } catch(err) {
                // TODO: Obviously not ready for primetime
                console.error(err)
            }

            Promise.resolve(true);
        } else {
            console.log('Invalid content:', message);

            // Messages don't seem to be cleared out with Promise.reject or errors, so use this
            Promise.resolve(false);
        }
    }
}

module.exports = ProcessorApp;
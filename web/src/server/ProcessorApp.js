const fs = require('fs');
const path = require('path');

// https://www.npmjs.com/package/sqs-consumer
const { Producer } = require('sqs-producer');
const BaseConsumer = require('./BaseConsumer');

class ProcessorApp {
    constructor(config) {
        this.config = config;
        this.cdnRoot = path.join(__dirname, '..', this.config.WEB_CDN);

        // TODO - Use this to handle user deletion
        // this.users = this.createConsumer(config, config.QUEUE_USERS, msg => { this.userHandler(msg) });
        // this.users.start();

        this.notificationRequests = new BaseConsumer(
            config,
            config.QUEUE_NOTIFICATIONS_REQUESTS,
            msg => { this.notificationHandler(msg); }
        );
        this.notificationRequests.start();

        this.notificationResponses = Producer.create({
            queueUrl: this.config.QUEUE_FULL_URL + this.config.QUEUE_NOTIFICATIONS_RESPONSES,
            region: this.config.ZONE
        });
        
        console.log('ProcessApp initialized!');
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
            const user = message.Body;
            const path = this.cdnRoot + `${user}.json`;
            try {
                const payload = fs.readFileSync(path, { encoding: 'utf-8'});
                const data = JSON.parse(payload);
                data.notifications += 1;
                fs.writeFileSync(path, JSON.stringify(data), { encoding: 'utf-8'});

                // Send message!
                const params = {
                    id: 'message' + user, // Assume this could be a rootId?
                    body: user,
                };
        
                this.notificationResponses.send([params]);
        
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
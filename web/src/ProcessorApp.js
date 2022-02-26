const fs = require('fs');

// https://www.npmjs.com/package/sqs-consumer
const { Consumer } = require('sqs-consumer');
// const { Producer } = require('sqs-producer');

class ProcessorApp {
    constructor(config) {
        this.users = this.createConsumer(config, config.QUEUE_USERS, this.userHandler);
        this.users.start();

        this.notifications = this.createConsumer(config, config.QUEUE_NOTIFICATIONS, this.notificationHandler);
        this.notifications.start();
        
        console.log('Consumer initialized!');
    }

    createConsumer(config, queue, handler) {
        // console.log(config, queue);
        const consumer = Consumer.create({
            queueUrl: config.QUEUE_FULL_URL + queue,
            handleMessage: message => { handler(message) }
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

    async userHandler(message) {
        if (message.Body) {
            console.log('Create new user:', message.MessageId, '/', message.Body);

            const user = message.Body;
            const path = `./swap/cdn/${user}.txt`;
            const notifications = "0";
            try {
                fs.writeFileSync(path, notifications, { encoding: 'utf-8'});
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
            const path = `./swap/cdn/${user}.txt`;
            try {
                let notifications = 1;
                notifications = fs.readFileSync(path, { encoding: 'utf-8'});
                notifications = Number(notifications) + 1;
                fs.writeFileSync(path, `${notifications}`, { encoding: 'utf-8'});
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
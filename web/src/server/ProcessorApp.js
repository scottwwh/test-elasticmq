const fs = require('fs');
const path = require('path');

// https://www.npmjs.com/package/sqs-consumer
const { Producer } = require('sqs-producer');
const BaseConsumer = require('./BaseConsumer');

class ProcessorApp {
    constructor(config) {
        this.config = config;
        this.cdnRoot = path.join(__dirname, '..', this.config.WEB_CDN);
        this.badgesRoot = path.join(__dirname, '..', this.config.WEB_PUBLIC, 'badges/');
        this.dataRoot = path.join(__dirname, '..', this.config.DATA);

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

    async updateNotificationBadge(id, notifications) {
        // Copy relevant badge
        const number = (notifications >= 10) ? 10 : notifications ;
        fs.copyFileSync(this.badgesRoot + `${number}.svg`, this.cdnRoot + `${id}.svg`)
    }

    // This should arguably be updating a database then copying images around for the client,
    // rather than processing JSON, but not quite there yet..
    //
    // TODO: Call specific async methods for each notification type
    async notificationHandler(message) {
        if (message.Body) {
            const payload = JSON.parse(message.Body);
            const type = payload.type;
            const id = payload.id;
            const path = this.dataRoot + `${id}.json`;

            if (payload.type == 'notification-create') {
                await this.updateNotificationBadge(id, 0);
                Promise.resolve(true);
                return;
            }

            try {
                // Udpate data
                const file = fs.readFileSync(path, { encoding: 'utf-8'});
                const data = JSON.parse(file);

                if (payload.type == 'notification-add') {
                    data.notifications += 1;
                } else if (payload.type == 'notification-clear') {
                    data.notifications = 0;
                }

                fs.writeFileSync(path, JSON.stringify(data), { encoding: 'utf-8'});

                await this.updateNotificationBadge(id, data.notifications);

                // Send response
                if (payload.type == 'notification-add') {
                    const params = {
                        id: 'message' + id, // Assume this could be a rootId?
                        body: id,
                    };
            
                    this.notificationResponses.send([params]);
                }
        
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
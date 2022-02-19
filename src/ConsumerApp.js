// https://www.npmjs.com/package/sqs-consumer
const { Consumer } = require('sqs-consumer');

class ConsumerApp {
    constructor(config) {
        const app = Consumer.create({
            queueUrl: config.QUEUE_BASE_URL + config.QUEUE_FIRST,

            handleMessage: async (message) => {
                if (message.Body) {
                    console.log('Processed ' + message.MessageId, '/', message.Body);
                    // console.log('Processed message: ' + JSON.stringify(message));

                    Promise.resolve(true);
                } else {
                    console.log('Invalid content:', message);

                    // Messages don't seem to be cleared out with Promise.reject or errors, so use this
                    Promise.resolve(false);
                }
            }
        });
          
        app.on('error', (err) => {
            console.error(err.message);
        });
        
        app.on('processing_error', (err) => {
            console.error(err.message);
        });

        app.on('empty', (err) => {
            console.error("Queue is empty!");
        });
        
        app.start();

        console.log('Consumer initialized!');
    }

    async messageHandler() {
        // Does nothing yet!
    }
}

module.exports = ConsumerApp;
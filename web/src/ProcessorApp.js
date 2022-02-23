// https://www.npmjs.com/package/sqs-consumer
const { Consumer } = require('sqs-consumer');
// const { Producer } = require('sqs-producer');

class ProcessorApp {
    constructor(config) {
        // this.producer = Producer.create({
        //     queueUrl: config.QUEUE_BASE_URL + config.QUEUE_RESPONSES,
        //     region: config.ZONE
        // });

        this.consumer = Consumer.create({
            queueUrl: config.QUEUE_FULL_URL + config.QUEUE_REQUESTS,
            handleMessage: message => { this.messageHandler(message) }
        });
          
        this.consumer.on('error', (err) => {
            console.error(err.message);
        });
        
        this.consumer.on('processing_error', (err) => {
            console.error(err.message);
        });

        this.consumer.on('empty', (err) => {
            console.error("Queue is empty!");
        });
        
        this.consumer.start();

        console.log('Consumer initialized!');
    }

    async messageHandler(message) {
        if (message.Body) {
            console.log('Processed ' + message.MessageId, '/', message.Body);
            // console.log('Processed message: ' + JSON.stringify(message));

            // const messages = [
            //     {
            //         id: 'test' + Math.floor(Math.random() * 100),
            //         body: 'Completed processing'
            //     }
            // ];

            // await this.producer.send(messages);

            Promise.resolve(true);
        } else {
            console.log('Invalid content:', message);

            // Messages don't seem to be cleared out with Promise.reject or errors, so use this
            Promise.resolve(false);
        }
    }
}

module.exports = ProcessorApp;
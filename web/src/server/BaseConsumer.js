// https://www.npmjs.com/package/sqs-consumer
const { Consumer } = require('sqs-consumer');

class BaseConsumer {
    constructor(config, queue, handler) {
        this.queue = queue;
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
            console.error(`Queue "${this.queue}" is empty!`);
        });

        return consumer;
    }
}

module.exports = BaseConsumer;
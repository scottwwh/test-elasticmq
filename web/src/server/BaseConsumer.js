// https://www.npmjs.com/package/sqs-consumer
const { Consumer } = require('sqs-consumer');

class BaseConsumer {
    constructor(config, queue, handler) {
        this.queue = queue;
        this.errorCount = 0;
        
        this.consumer = Consumer.create({
            queueUrl: config.QUEUE_FULL_URL + queue,
            handleMessage: handler
        });
            
        this.consumer.on('error', (err) => {
            this.errorCount++;
            console.error(`Error #${this.errorCount}:`, err.message);
        });
        
        this.consumer.on('processing_error', (err) => {
            console.error(err.message);
        });

        this.consumer.on('empty', (err) => {
            console.error(`Queue "${this.queue}" is empty!`);
        });
    }

    start() {
        this.consumer.start();
    }
}

module.exports = BaseConsumer;
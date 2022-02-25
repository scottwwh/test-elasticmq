// Assumes TypeScript
// import { SQS } from 'aws-sdk';

// Not really necessary at the moment, but good to keep around
const { SQS } = require('aws-sdk');

// const config = require('./src/config');
const Message = require('./Message');

// Set up a producer: https://www.npmjs.com/package/sqs-producer
const { Producer } = require('sqs-producer');

class ClientApp {
    constructor(config) {
        this.config = config;
    }

    async init() {
        console.log(this.config);

        // this.queue = new SQS({
        //     endpoint: this.config.QUEUE_BASE_URL,
        //     region: this.config.ZONE, // This does not matter
        // });
          
        // const queues = await this.queue.listQueues().promise();
        // console.log(queues);

        // // Create simple producer
        this.producer = Producer.create({
            queueUrl: this.config.QUEUE_FULL_URL + this.config.QUEUE_REQUESTS,
            region: this.config.ZONE
        });
    }

    async sendMessages() {
        
        // Send a message to the queue with a specific ID (by default the body is used as the ID)
        const messages = [];
        const max = Math.floor(Math.random() * 10) + 1;
        // const max = 1;
        for (var i = 0; i < max; i++) {
            const valid = Math.random() > 0.5 ? true : false ;
            const params = {
                id: 'message' + i, // Assume this could be a rootId?
                body: `${i}`,

                // Throws an exception?
                // messageAttributes: {
                //   attr1: { DataType: 'Boolean', BooleanValue: valid }
                // }          
            };

            // Throws an exception when pushed into the queue
            //
            // const message = new Message(params);
            console.log(params);
            messages.push(params);
        }

        await this.producer.send(messages);

        // Get the current size of the queue
        // const size = await this.producer.queueSize();
        // console.log(`There are currently ${size} messages on the queue.`);
    }
}

module.exports = ClientApp;
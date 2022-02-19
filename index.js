// Assumes TypeScript
// import { SQS } from 'aws-sdk';

// Not really necessary at the moment, but good to keep around
const { SQS } = require('aws-sdk');

const config = require('./src/config');
const Message = require('./src/Message');

const queue = new SQS({
  endpoint: 'http://localhost:9324',
  region: 'us-east-1', // it does not matter
});

(async () => {
  const queues = await queue.listQueues().promise();
  console.log(queues);


  // Set up a producer: https://www.npmjs.com/package/sqs-producer

  const { Producer } = require('sqs-producer');
 



  // create simple producer
  const producer = Producer.create({
    queueUrl: config.QUEUE_BASE_URL + config.QUEUE_FIRST,
    region: config.ZONE
  });
  
  // Send a message to the queue with a specific ID (by default the body is used as the ID)
  const messages = [];
  const max = Math.floor(Math.random() * 10);
  for (var i = 0; i < max; i++) {
      const valid = Math.random() > 0.5 ? true : false ;
      const params = {
          id: 'message' + i, // Assume this could be a rootId?
          body: 'Cheese Danish #' + i,

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

  await producer.send(messages);

  // Get the current size of the queue
  const size = await producer.queueSize();
  console.log(`There are currently ${size} messages on the queue.`);
  
})();
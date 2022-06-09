# ElasticMQ test

## Background

I started this repo to test ElasticMQ as a drop-in replacement for SQS.

Work started [based on a simplified version of this tutorial](https://github.com/alxolr/elasticmq-node-tutorial) but quickly got sidetracked proofing out UI for a simple content pipeline to generate notifications asynchronously.

I'm using [ElasticMQ's default Docker image](https://github.com/softwaremill/elasticmq) which supports ARM 64.

![Sequence flow diagram](./docs/system.png)

Gotchas:
- AWS' SDK is semi-magical in accessing cached credentials when developing locally, but of course these need to be explicitly passed in when launching via Docker Compose - see [env reference](./env.reference).

## TODO

- Restore pure CSS notification badges following first load to get rid of flickering
- Add Data class to manage IO until there's a database
- Add NotificationMessage class to reduce boilerplate
- Add "intermediate" visual state when notifications requested < notifications received
- **DONE** - Create static image for notification badges on first load
- **DONE** - Add UUIDv4 identifiers for users
- **DONE** - Add WebSockets for notifications (https://ably.com/blog/web-app-websockets-nodejs)

## Requirements

To run, install:
- Docker Compose

Next, copy `.env.reference` to `.env` and configure values for AWS.

Finally, build/launch like so:
```
# Build web services/UI
docker-compose build web

# Launch containers
docker-compose up
```

Once launched, the following URLs will be available:
- Web: http://localhost:3000/
- ElasticMQ UI: http://localhost:9325/

## Development

### Dependencies

On the app side:
- npm v8.3
- Node v17.3 (using Koa, and BBC's two SQS libraries: SQS Producer and SQS Consumer)
- Vanilla HTML/JS

## Alternatives

One could simply test using AWS mocks: https://github.com/dwyl/aws-sdk-mock
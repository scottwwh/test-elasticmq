# ElasticMQ test

## Reference

Testing ElasticMQ using a simplified version of this tutorial: https://github.com/alxolr/elasticmq-node-tutorial

For the messaque queue, I'm using the [default Docker image](https://github.com/softwaremill/elasticmq) which seems to support ARM 64.

## Requirements

You must install:
- Docker Compose

To run:
```
# Build web services/UI
docker-compose build web

# Run containers
docker-compose up
```

## Development

### Dependencies

On the web side, quite simple:
- Koa
- BBC's two SQS libraries: SQS Producer and SQS Consumer
- Vanilla HTML/JS

Once launched, the following will be available:
- Web: http://localhost:3000/
- ElasticMQ UI: http://localhost:9325/

## Alternatives

One could simply test using AWS mocks: https://github.com/dwyl/aws-sdk-mock
# ElasticMQ test

## Reference

Testing ElasticMQ using a simplified version of this tutorial: https://github.com/alxolr/elasticmq-node-tutorial

I am using the [default Docker image](https://github.com/softwaremill/elasticmq) which seems to support ARM 64.

Run:
```
docker-compose.yml up
```

Commands:
```
cd ./sqs-mocks
docker build -t sqs-mock .
```

## Alternatives

One could simply test using AWS mocks: https://github.com/dwyl/aws-sdk-mock
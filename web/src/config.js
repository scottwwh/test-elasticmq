const config = {
    ZONE: 'us-east-1',
    // QUEUE_BASE_URL: 'http://elasticmq:9324',
    // QUEUE_FULL_URL: 'http://elasticmq:9324/000000000000/',
    QUEUE_BASE_URL: 'http://localhost:9324',
    QUEUE_FULL_URL: 'http://localhost:9324/000000000000/',
    QUEUE_REQUESTS: 'processor-requests',
    QUEUE_RESPONSES: 'processor-notifications'
}

module.exports = config;
const config = {
    ZONE: 'us-east-1',
    QUEUE_BASE_URL: process.env.QUEUE_BASE_URL,
    QUEUE_FULL_URL: process.env.QUEUE_FULL_URL,
    QUEUE_USERS: 'processor-user-requests',
    QUEUE_NOTIFICATIONS_REQUESTS: 'processor-notification-requests',
    QUEUE_NOTIFICATIONS_RESPONSES: 'processor-notification-responses',
    DATA: './client/data/',
    WEB_PUBLIC: './client/',
    WEB_CDN: './client/cdn/'
}

module.exports = config;
const config = {
    ZONE: 'us-east-1',
    QUEUE_BASE_URL: process.env.QUEUE_BASE_URL,
    QUEUE_FULL_URL: process.env.QUEUE_FULL_URL,
    QUEUE_USERS: 'processor-user-requests',
    QUEUE_NOTIFICATIONS: 'processor-notification-requests',
    WEB_PUBLIC: './public/',
    WEB_CDN: './public/cdn/'
}

module.exports = config;
/**
 * Possibly useless, since ElasticMQ (or sqs-producer) is throwing an exception?
 */
class Message{
    constructor(params) {
        if (!params.id || !params.body) {
            throw Error("Invalid message format");
        };

        this.id = params.id;
        this.body = params.body;
        this.valid = params.valid;
    }
}

module.exports = Message;
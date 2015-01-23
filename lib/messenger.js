var AWS = require('aws-sdk');
var connect = require('./connect');
var worker = require('./worker');
var config = require('./config').Config;

// Instantiate SQS client
var sqs = new AWS.SQS({
    accessKeyId: config.get('awsKey'),
    secretAccessKey: config.get('awsSecret'),
    region: config.get('awsRegion')
});

config.set('sqsQueueUrl', sqs.endpoint.protocol + '//' + sqs.endpoint.hostname + '/' + config.get('sqsQueue'));

getSQSMessage = function() {
    sqs.receiveMessage({
        QueueUrl: config.get('sqsQueueUrl'),
        MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
        VisibilityTimeout: 600, // seconds - how long we want a lock on this job
        WaitTimeSeconds: 20 // seconds - how long should we wait for a message?
    }, function(err, data) {
        // If there are any messages to get
        console.log('listening: ', config.get('sqsQueueUrl'));
        if (data.Messages) {
            // Get the first message (should be the only one since we said to only get one above)
            var message = data.Messages[0],
            body = JSON.parse(message.Body);
            var record = body.Records[0];
            var file = record.s3.object;
            if (file.size > 0) {
              worker.processScript(file.key, function(err, msg){
                getSQSMessage();
              });
            } else {
              getSQSMessage();
            }
            removeFromQueue(message);
        } else {
            getSQSMessage();
        }
    });
};

var removeFromQueue = function(message) {
    sqs.deleteMessage({
        QueueUrl: config.get('sqsQueueUrl'),
        ReceiptHandle: message.ReceiptHandle
    }, function(err, data) {
        // If we errored, tell us that we did
        if (err) console.log(err);
    });
};

module.exports = {
    getSQSMessage: getSQSMessage,
    removeFromQueue: removeFromQueue
};
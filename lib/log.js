var bunyan = require("bunyan"); // Bunyan dependency


var log = bunyan.createLogger({
    name: 'item-splitter',
    streams: [{
        type: 'rotating-file',
        path: '/Users/cbwheadon/bin/item-splitter.log',
        period: '1d',   // daily rotation
        count: 3,        // keep 3 back copies
        level: 'error',
    },
    {
        level: 'info',
        stream: process.stdout
    },
    ]
});

module.exports = log;
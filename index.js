/*jslint node: true */
"use strict";

module.exports = {
    connect : require('./lib/connect'),
    reader : require('./lib/reader'),
    worker: require('./lib/worker'),
    messenger: require('./lib/messenger'),
};

var messenger = require('./lib/messenger');
messenger.getSQSMessage();
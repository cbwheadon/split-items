/*jslint node: true */
"use strict";

module.exports = {
    connect : require('./lib/connect'),
    reader : require('./lib/reader'),
    worker: require('./lib/worker'),
};

var worker = require('./lib/worker');
worker.processFiles('tiffs/incoming');
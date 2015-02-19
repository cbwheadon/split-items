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

/*
var reader = require('./lib/reader');
var script = {qrcode:'ABC', booklet:'H1', _id:'1234'};
var item = {pages:[22,23], x1:0, x2:1650, y1: 700, y2:500, name:'25'};
var dir = 'images';
reader.splitItem(script, item, dir, function(msg, err){
  console.log(msg,err);
});
*/
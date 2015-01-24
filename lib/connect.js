var config = require('./config').Config;
var moment = require('moment');

var findScript = function (qrcode, callback) {
	// Gets the players from the database and returns as array
	var MongoClient = require('mongodb').MongoClient, format = require('util').format;
    MongoClient.connect(config.get('mongoUri'), function (err, db) {
    if (err) {
        throw err;
    } else {
        db.collection('scripts',function(err,collection){
            collection.findOne({qrcode: qrcode}, function(err, script) {
                callback(err, script);
                db.close();
            });
        });
    }
  });
};

var updateScript = function (qrcode, callback) {
    // Gets the players from the database and returns as array
    var MongoClient = require('mongodb').MongoClient, format = require('util').format;
    MongoClient.connect(config.get('mongoUri'), function (err, db) {
    if (err) {
        throw err;
    } else {
        db.collection('scripts',function(err,collection){
            collection.update({qrcode: qrcode},{$set:{processed:true, processedAt:  moment().format()}}, function(err, doc) {
                db.close();
            });
        });
    }
  });
};

var findItems = function (script,callback) {
    // Gets the players from the database and returns as array
    var MongoClient = require('mongodb').MongoClient, format = require('util').format;
    MongoClient.connect(config.get('mongoUri'), function (err, db) {
    if (err) {
        throw err;
    } else {
        db.collection('items',function(err,collection){
            collection.find({booklet:script.booklet}).toArray(function(err,items){
                db.close();
                callback(err, items);
            });
        });
    }
  });
};

var insertResponse = function (script, outFile, item, callback) {
    var MongoClient = require('mongodb').MongoClient, format = require('util').format;
    MongoClient.connect(config.get('mongoUri'), function (err, db) {
    if (err) {
        throw err;
    } else {
        db.collection('responses',function(err,collection){
            collection.insert({filePath: outFile, booklet: script.booklet, task:script.task, owners:script.owners, item:item._id, timesToMark:item.timesToMark, markingComplete: false, script: script._id}, function(err, outFile) {
                callback(err, outFile);
                db.close();
            });
        });
    }
  });
};

module.exports = {
    findScript: findScript,
    findItems: findItems,
    insertResponse: insertResponse,
    updateScript: updateScript,
};
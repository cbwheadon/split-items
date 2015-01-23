var config = require('./config').Config;
var moment = require('moment');

var findScript = function (file, qrcode, callback) {
	// Gets the players from the database and returns as array
	var MongoClient = require('mongodb').MongoClient, format = require('util').format;
    MongoClient.connect(config.get('mongoUri'), function (err, db) {
    if (err) {
        throw err;
    } else {
        db.collection('scripts',function(err,collection){
            collection.findOne({qrcode: qrcode}, function(err, doc) {
                callback(err, file, doc);
                db.close();
            });
        });
    }
  });
};

var updateScript = function (qrcode) {
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
                callback(err, script, items);
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
            collection.insert({filePath: outFile, booklet: script.booklet, task:script.task, owner:script.owner, item:item._id, script: script._id}, function(err, outFile) {
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
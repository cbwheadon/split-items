var reader = require('./reader');
var connect = require('./connect');
var aws = require('./aws');
var tmp = require('tmp');
var path = require('path');
var fs = require('fs');
var async = require('async');

var processScript = function(fn, callback) {
    var script;
    var tmpDir;
    var items;
    var qrcode;
    async.series([
        //First find a script
        function(callback) {
            console.log('checking qr code');
            qrcode = fn.slice(0, -4);
            connect.findScript(qrcode, function(err, doc) {
                if (err) return callback(err);
                else if (doc === null) {
                    return callback(new Error('No script with qr code ' + qrcode + ' found.'));
                } else {
                    //check to see if already processed
                    if (doc.processed === true) {
                        return callback(new Error('Script with qr code ' + qrcode + ' already processed.'));
                    } else {
                        console.log('Processing: ', fn);
                        script = doc;
                        callback();
                    }
                }
            });
        },
        //Now make a temporary directory
        function(callback) {
            console.log('processing item');
            tmp.dir(function _tempDirCreated(err, tmpDir) {
                dir = tmpDir;
                if (err) return callback(err);
                var outPath = path.join(dir, 'jpegs');
                fs.mkdirSync(outPath);
                outPath = path.join(dir, 'items');
                fs.mkdirSync(outPath);
                console.log('temp dir:', dir);
                //In scope of temp directory perform a series of actions
                async.series([
                    //Split the script into jpegs
                    function(callback) {
                        reader.splitScript(fn, dir, function(err) {
                            if (err) return callback(err);
                            console.log('jpegs created');
                            callback();
                        });
                    },
                    //Find the items in the item collection
                    function(callback) {
                        connect.findItems(script, function(err, itemsColl) {
                            if (err) return callback(err);
                            if (itemsColl.length === 0) {
                                return callback(new Error('No Items Found for script ' + script));
                            }
                            items = itemsColl;
                            console.log('items', items.length);
                            callback();
                        });
                    },
                    //Now loop through the items
                    function(callback) {
                        async.each(items, function(item, callback) {
                            // Perform operation on file here.
                            console.log('Processing item ' + item.name);
                            // Do work to process file here
                            reader.splitItem(script, item, dir, function(err){
                                if (err) return callback(err);
                                console.log('Item processed ' + item.name);
                                callback();
                            });
                        }, function(err) {
                            // if any of the file processing produced an error, err would equal that error
                            if (err) {
                                // One of the iterations produced an error.
                                // All processing will now stop.
                                return callback(new Error('An item failed to process'));
                            } else {
                                console.log('All items have been processed successfully');
                                callback();
                            }
                        });
                    },
                    //All items have been split, upload them to aws
                    //Loop through the tmp/items directory and upload
                    function(callback) {
                        var imagesPath = path.join(dir,'items');
                        async.each(items, function(item, callback){
                            var imageFile = script._id + '-' + script.booklet + '-' + item.name + '.jpeg';
                            var outFileFullPath = path.join(imagesPath, imageFile);
                            var remotePath = path.join(script.task, imageFile);
                            aws.uploadItem(outFileFullPath, remotePath, function(err, res) {
                                if(err) return callback(err);
                                console.log('Item uploaded to: ', remotePath);
                                //If upload successful insert response
                                connect.insertResponse(script, remotePath, item, function(err) {
                                    if(err) return callback(err);
                                    console.log('response recorded', item.name);
                                    callback();
                                });
                            });
                        }, function(err){
                            if (err) {
                                return callback(new Error('An item failed to upload'));
                            } else {
                                console.log('All items uploaded to aws & responses recorded');
                                callback();
                            }
                        });
                    },
                ], function(err){
                    if(err) return callback(err);
                    console.log('tmp directory destroyed');
                    callback();
                });
            });
        },
        function(callback) {
            console.log('Finally set script as processed');
            connect.updateScript(qrcode, function(err) {
                if(err) return callback(err);
                callback();
            });
        },
    ], function(err) {
        if (err) return callback(err);
        console.log('worker completed task');
        callback();
    });
};

module.exports = {
    processScript: processScript,
};
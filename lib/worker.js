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
    async.series([
        //First find a script
        function(callback) {
            var qrcode = fn.slice(0, -4);
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
                            reader.splitItem(script, item, dir, function(){
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
                            }
                        });
                    },
                ]);
                callback();
            });
        },
    ], function(err) {
        if (err) return callback(err);
        callback();
    });
};

/*

                        else {
                                    async.forEach(items, function(item, callback) { //The second argument (callback) is the "task callback" for a specific messageId
                                        reader.splitItem(script, item, dir, callback); //When the db has deleted the item it will call the "task callback". This way async knows which items in the collection have finished
                                    }, function(err) {
                                        if (err) return next(err);
                                        //Tell the user about the great success
                                        res.json({
                                            success: true,
                                            message: items.length + ' item(s) processed.'
                                        });
                                    });
                                    //for (var i = 0; i < items.length; i++) {
                                    //   reader.splitItem(script, items[i], dir, function(err, script, outFileFullPath, outFile, item) {
                                    //        var insertResponse = connect.insertResponse;
                                    //        var remotePath = path.join(script.task, outFile);
                                    //        insertResponse(script, remotePath, item, function(err, msg) {
                                    //            //upload to s3
                                    //            aws.uploadItem(outFileFullPath, remotePath, function(err, res) {
                                    //                res.resume();
                                    //            });
                                    //       });
                                    //    });
                                    //}
                                }
                                callback();
                            });
                        },
                    ], function(err) {
                        if (err) {
                            console.log(err);
                        }
                        callback();
                    });
                });
            }
        }
    });
};
*/
module.exports = {
    processScript: processScript,
};
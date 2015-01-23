var reader = require('./reader');
var connect = require('./connect');
var aws = require('./aws');
var tmp = require('tmp');
var path = require('path');
var fs = require('fs');

var processScript = function(fn, callback) {
    var qrcode = fn.slice(0, -4);
    connect.findScript(fn, qrcode, function(err, script) {
        if (err) {
            console.log(err);
        } else if (script === null) {
            console.log('Not Found: ', fn);
        } else {
            //check to see if already processed
            if (script.processed === true) {
                console.log('Already processed: ', fn);
            } else {
                console.log('Processing: ', fn);
                connect.updateScript(script.qrcode);
                tmp.dir(function _tempDirCreated(err, dir) {
                    if (err) throw err;
                    var outPath = path.join(dir, 'jpegs');
                    fs.mkdirSync(outPath);
                    outPath = path.join(dir, 'items');
                    fs.mkdirSync(outPath);
                    reader.splitScript(fn, dir, function(err) {
                        //Jpegs created, time to process images
                        connect.findItems(script, dir, processItems);
                    });
                });
                callback();
            }
        }
    });
};

var processItems = function(err, script, items, dir) {
    if (err) {
        console.log(err);
    } else if (items.length === 0) {
        console.log('No Items Found!');
    } else {
        for (var i = 0; i < items.length; i++) {
            reader.splitItem(script, items[i], dir, updateFileName);
        }
    }
};

var updateFileName = function(err, script, outFileFullPath, outFile, item) {
    var insertResponse = connect.insertResponse;
    var remotePath = path.join(script.task, outFile);
    insertResponse(script, remotePath, item, function(err, msg) {
        //upload to s3
        aws.uploadItem(outFileFullPath, remotePath, function(err, res) {
            res.resume();
        });
    });
};

module.exports = {
    processScript: processScript,
};
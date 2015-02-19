var knox = require('knox');
var config = require('./config').Config;
var path = require('path');
var fs = require('fs');

var clientIn = knox.createClient({
    key: config.get('awsKey'),
    secret: config.get('awsSecret'),
    region: config.get('awsRegion'),
    bucket: config.get('awsUploadBucket'),
});

var clientOut = knox.createClient({
    key: config.get('awsKey'),
    secret: config.get('awsSecret'),
    region: config.get('awsRegion'),
    bucket: config.get('awsBucket')
});

var uploadItem = function(localFile, s3File, callback){
  clientOut.putFile(localFile, s3File, function(err, res){
    callback(err, res);
  });
};

var getFile = function(s3File, localPath, callback){
  //s3 file has directory then file name
  var dat = s3File.split('/');
  var s3FileName = dat[1];
  var s3Directory = dat[0];
  var localFile = path.join(localPath, s3FileName);
  var outStream = fs.createWriteStream(localFile);
  clientIn.getFile(s3File, function(err, res){
    res.on('data', function(chunk) { outStream.write(chunk); });
    res.on('end', function(chunk) {
      outStream.end();
      callback();
    });
  });
};

module.exports = {
    uploadItem: uploadItem,
    getFile: getFile,
};
var knox = require('knox');
var config = require('./config').Config;
var path = require('path');

var client = knox.createClient({
    key: config.get('awsKey'),
    secret: config.get('awsSecret'),
    region: config.get('awsRegion'),
    bucket: config.get('awsBucket')
});

var uploadItem = function(outFile, callback){
  client.putFile(outFile, outFile, function(err, res){
    callback(err, res);
  });
};

var archiveScript = function(script, callback){
  scriptFile = script.qrcode + '.tif';
  filePath = config.get('filePath');
  fullFilePath = path.join(filePath, 'scripts', scriptFile);
  client.putFile(fullFilePath, fullFilePath, function(err, res){
    res.resume();
  });
};

module.exports = {
    uploadItem: uploadItem,
    archiveScript: archiveScript,
};
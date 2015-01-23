var fs = require('fs');
var path = require('path');
var gm = require('gm');
var config = require('./config').Config;

var checkForNewFiles = function(){
    var filePath = config.get('filePath');
    var infiles = path.join(filePath, 'scripts');
    var files = fs.readdirSync(infiles);
    return files;
};

var splitScript = function(file, callback){
  var qrcode = file.slice(0, -4);
  var filePath = config.get('filePath');
  var infile = path.join(filePath, 'scripts',file);
  var outPath = path.join(filePath, 'jpegs', qrcode);
  fs.mkdirSync(outPath);
  var outFile = path.join(outPath,'%02d.jpeg');
  gm().command('convert').in('+adjoin').in(infile).write(outFile, function(err) {
    callback(err, infile);
  });
};

var splitItem = function(script, item, callback){
  var filePath = config.get('filePath');
  var itemPage = +item.itemPage;
  if(itemPage<10) {
    fn  = '0' + (itemPage - 1) + '.jpeg';
  } else {
    fn = (itemPage - 1) + '.jpeg';
  }
  var inFile = path.join(filePath, 'jpegs', script.qrcode , fn);
  var outFileName = script._id + '-' + script.booklet + '-' + item.name + '.jpeg';
  var outFile = path.join(filePath, 'items', outFileName);
  var x1 = +item.x1;
  var y1 = +item.y1;
  var x2 = +item.x2;
  var y2 = +item.y2;
  var width = x2 - x1;
  var height = y2 - y1;
  gm(inFile)
    .crop(width, height, x1, y1)
    .write(outFile, function(err) {
      callback(err, script, outFile, item);
    });
};

module.exports = {
    checkForNewFiles: checkForNewFiles,
    splitScript: splitScript,
    splitItem: splitItem,
};
var fs = require('fs');
var path = require('path');
var gm = require('gm');
var aws = require('./aws');
var config = require('./config').Config;
var async = require('async');

var splitScript = function(file, localPath, callback){
  //Split script into jpegs
  aws.getFile(file, localPath, function(){
    var qrcode = file.slice(0, -4);
    var infile = path.join(localPath, file);
    var outPath = path.join(localPath, 'jpegs', qrcode);
    fs.mkdirSync(outPath);
    var outFile = path.join(outPath,'%02d.jpeg');
    console.log(infile, outFile);
    gm().command('convert').in('+adjoin').in(infile).write(outFile, function(err) {
      callback(err, infile);
    });
  });
};

var processSplit = function(itemPage, item, script, filePath, callback){
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
    //console.log(inFile, width, height, x1, y1, outFile);
    gm(inFile)
      .crop(width, height, x1, y1)
      .write(outFile, function(err) {
        callback(outFile,err);
      });
};

var splitItem = function(script, item, dir, callback){
  //If an item is across multiple pages
  //Take x1 y1 co-ordinates of first item to bottom
  //Take all of any middle pages
  //Take top to x2 y2 coordinates to bottom
  //Join them all together
  var filePath = dir;
  var itemPages = item.pages;
  if(itemPages.length==1){
    processSplit(itemPages[0], item, script, filePath, function(msg, err){
      callback(msg, err);
    });
  } else {
    console.log('multi-page item');
    var pageNames =[];
    async.series([
      function(callback) {
        //Create a directory for the item
        var itemPath = path.join(dir, item.name);
        //fs.mkdirSync(itemPath);
        //Page 1
        //Take x1 y1 coordinates of item to bottom
        var firstPage ={};
        firstPage.x1 = item.x1;
        firstPage.y1 = item.y1;
        firstPage.x2 = item.x2;
        firstPage.y2 = 2300;
        firstPage.name = item.name;
        processSplit(itemPages[0], firstPage, script, dir, function(msg, err){
          pageNames.push(msg);
          callback();
        });
      },
      function(callback){
        //Any middle pages
        if(itemPages.length>2){
          for(var i=1; i<itemPages.length-1; i++){
            var itemPage = itemPages[i];
            if(itemPage<10) {
              fn  = '0' + (itemPage - 1) + '.jpeg';
            } else {
              fn = (itemPage - 1) + '.jpeg';
            }
            var inFile = path.join(filePath, 'jpegs', script.qrcode , fn);
            pageNames.push(inFile);
          }
        }
        //Last page
        //Take top to x2 y2 coordinates of item
        var lastPage = {};
        lastPage.x1 = item.x1;
        lastPage.x2 = item.x2;
        lastPage.y1 = 0;
        lastPage.y2 = item.y2;
        lastPage.name = item.name + '-2';
        processSplit(itemPages[itemPages.length-1], lastPage, script, dir, function(msg, err){
          pageNames.push(msg);
          callback();
        });
      },
      function(callback){
        //Stick them all together
        var p1 = pageNames.shift();
        async.eachSeries(pageNames, function(pageName, callback){
          gm(p1)
            .append(pageName)
            .write(p1, function(err) {
              if(err) console.log(err);
              callback();
            });
        }, function(err, msg){
          //delete final page
          //clean up
          fs.unlinkSync(pageNames[pageNames.length-1]);
          callback();
        });
      },
    ], function(msg, err){
      //console.log(msg, err);
    });
  }
};

module.exports = {
    splitScript: splitScript,
    splitItem: splitItem,
};
var fs = require('fs');
var path = require('path');
var gm = require('gm');
var aws = require('./aws');
var config = require('./config').Config;
var async = require('async');
var log = require("./log");

var splitScript = function(file, localPath, callback){
  //Split script into jpegs
  log.info('splitScript: ',file, localPath);
  aws.getFile(file, localPath, function(){
    var dat = file.split("/");
    var qrcode = dat[1].slice(0, -4);
    var infile = path.join(localPath, dat[1]);
    var outPath = path.join(localPath, 'jpegs', qrcode);
    fs.mkdirSync(outPath);
    var outFile = path.join(outPath,'%02d.jpeg');
    gm().command('convert').in('+adjoin').in(infile).write(outFile, function(err) {
      //count how many files there are
      var nPages = fs.readdirSync(outPath).length;
      callback(err, nPages);
    });
  });
};

var processSplit = function(itemPage, item, script, filePath, callback){
    if(itemPage<11) {
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
    //log.info(inFile, width, height, x1, y1, outFile);
    gm(inFile)
      .crop(width, height, x1, y1)
      .write(outFile, function(err) {
        callback(err, outFile);
      });
};

var splitItem = function(script, item, dir, callback){
  //If an item is across multiple pages
  //Take x1 y1 co-ordinates of first item to bottom
  //Take all of any middle pages
  //Take top to x2 y2 coordinates to bottom
  //Join them all together
  var filePath = dir;
  if (!item.hasOwnProperty('pages')) return(callback(new Error('No pages specified for item')));
  var itemPages = item.pages;
  if(itemPages.length==1){
    processSplit(itemPages[0], item, script, filePath, function(err, msg){
      callback(err, msg);
    });
  } else {
    log.info('multi-page item');
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
        processSplit(itemPages[0], firstPage, script, dir, function(err, msg){
          if (err) callback(err);
          pageNames.push(msg);
          callback();
        });
      },
      function(callback){
        //Any middle pages
        var nPages = 1 + (itemPages[1] - itemPages[0]);
        if(nPages>2){
          for(var i=(itemPages[0] + 1); i<itemPages[1]; i++){
            var itemPage = i;
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
        processSplit(itemPages[itemPages.length-1], lastPage, script, dir, function(err, msg){
          if(err) callback(err);
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
              if(err) callback(err);
              callback();
            });
        }, function(err, msg){
          //delete final page
          //clean up
          if (err) callback(err);
          fs.unlinkSync(pageNames[pageNames.length-1]);
          callback();
        });
      },
    ], function(err, msg){
      if (err) callback (err);
      callback(err, msg);
    });
  }
};

module.exports = {
    splitScript: splitScript,
    splitItem: splitItem,
};
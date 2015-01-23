var reader = require('./reader');
var connect = require('./connect');
var aws = require('./aws');

var processFiles = function(){
  var files = reader.checkForNewFiles();
  if(files.length>0){
    for (var i=0; i<files.length; i++) {
      var file = files[i];
      // check the qr code
      var qrcode = file.slice(0, -4);
      connect.findScript(file, qrcode, processScript);
    }
  }
};

var processScript = function(err, file, script){
  if(err){
    console.log(err);
  } else if (script===null) {
    console.log('Not Found: ', file);
  } else {
    //check to see if already processed
    if (script.processed ===true) {
      console.log('Already processed: ', file);
    } else {
      console.log('Processing: ', file);
      // update script status
      connect.updateScript(script.qrcode);
      // archive script
      aws.archiveScript(script);
      reader.splitScript(file, function(err, msg){
        //Jpegs created, time to process images
        connect.findItems(script, processItems);
      });
    }
  }
};

var processItems = function(err, script, items){
  if(err){
    console.log(err);
  } else if (items.length===0) {
    console.log('No Items Found!');
  } else {
    for(var i=0; i<items.length; i++){
      reader.splitItem(script, items[i], updateFileName);
    }
  }
};

var updateFileName = function(err, script, outFile, item){
  var insertResponse = connect.insertResponse;
  insertResponse(script, outFile, item, function(err, msg){
    //upload to s3
    aws.uploadItem(outFile, function(err, res){
      res.resume();
    });
  });
};

module.exports = {
    processFiles: processFiles,
};
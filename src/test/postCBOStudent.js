var request      = require(__dirname + '/../lib/cli/request');
var Request      = new request();
var fs = require('fs');
//var xmlFile = __dirname + '/data/xsre.xml';
var xmlFile = __dirname + '/data/postcbo2.xml';
fs.readFile(xmlFile, function(err, data) {
    if(err) {
        return console.log(err);
    }
    Request.push(data+'', function(){});
    //console.log(data+'');
    //console.log(require('prettyjson').render(data));

});




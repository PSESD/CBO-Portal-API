'use strict';
/**
 * Created by zaenal on 01/09/15.
 */

var fs = require('fs');
var xmlFile = __dirname + '/error.xml';
var parseString = require('xml2js').parseString;
fs.readFile(xmlFile, function(err, data) {
      if(err) {
            return console.log(err);
      }

      parseString(data, {
            normalize: true,
            explicitArray: false,
            parseBooleans: true,
            parseNumbers: true,
            stripPrefix: true,
            firstCharLowerCase: true,
            ignoreAttrs: true
      }, function (err, result) {

            if(err) {
                  return console.log(err);
            }

            console.log(require('prettyjson').render(result));
            console.log(result);
      });

});

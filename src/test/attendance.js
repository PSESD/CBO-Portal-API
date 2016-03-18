'use strict';
/**
 * Created by zaenal on 01/09/15.
 */
var xSre = require(__dirname+'/../lib/xsre');

var fs = require('fs');
//var xmlFile = __dirname + '/../../../mockhzb/sid/sample1.xml';
var xmlFile = __dirname + '/data/xsre.xml';
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
        var color = {
            keysColor: 'rainbow',
            dashColor: 'magenta',
            stringColor: 'white'
        };

        //new xSre(result).getAttendanceBehavior().getAttendances();
        //console.log(require('prettyjson').render(new xSre(result).getAttendanceBehavior().getAttendances()), color);
        //console.log(JSON.stringify(new xSre(result).getAttendanceBehavior().getAttendances()));
        console.log(require('prettyjson').render(new xSre(result).getAttendanceBehavior().calculateSummary()));
    });

});

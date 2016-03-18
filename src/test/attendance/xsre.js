/**
 * Created by zaenal on 28/08/15.
 */
'use strict';
var xSre = require(__dirname+'/../../lib/xsre');

var parseString = require('xml2js').parseString;
var fs = require('fs');


var xmlFile = __dirname + '/sample/sample_10713556.xml';
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

        var xsre = new xSre(result);
        var transcript = xsre.getTranscript().getTranscript();
        var attendance = xsre.getAttendanceBehavior().getAttendances();
        var assessment = xsre.getAssessment().getAssessment();
        var personal = xsre.getPersonal().getPersonal();
        console.log(require('prettyjson').render(attendance));
    });

});


function dailyAttendance(){

}

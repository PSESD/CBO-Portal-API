/**
 * Created by zaenal on 28/08/15.
 */
'use strict';
var xSre = require(__dirname+'/../lib/xsre');

var fs = require('fs');
//var xmlFile = __dirname + '/../../../mockhzb/sid/sample1.xml';
//var xmlFile = __dirname + '/data/xml.xml';
var xmlFile = __dirname + '/data/sample1.xml';
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

        console.log(require('prettyjson').render(new xSre(result).getTranscript().getTranscript()));
        //var transcript = new xSre(result).getTranscript().getTranscript();
        //var t = [];
        //transcript.details.forEach(function(tr){
        //    t.push({
        //        gradeLevel: tr.gradeLevel,
        //        schoolYear:  tr.schoolYear,
        //        schoolName:  tr.schoolName,
        //        'startDate':  tr.startDate,
        //        startDateTime:  tr.startDateTime,
        //        session:  tr.session,
        //        totals: tr.schoolYear === '2015' ? tr.transcripts : Object.keys(tr.transcripts).length
        //    });
        //});
        //console.log(require('prettyjson').render(t));
    });

});

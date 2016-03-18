/**
 * Created by zaenal on 28/08/15.
 */
'use strict';
var xSre = require(__dirname+'/../lib/xsre');

var fs = require('fs');
var xmlFile = __dirname + '/data/xsre.xml';
//var xmlFile = __dirname + '/data/xml.xml';
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

            var xsre = new xSre(result);
            var transcript = xsre.getTranscript().getTranscript();
            var attendance = xsre.getAttendanceBehavior().getAttendances();
            var assessment = xsre.getAssessment().getAssessment();
            var personal = xsre.getPersonal().getPersonal();
            var attendanceSummary = [];
            attendance.forEach(function(a, i){
                for(var k in a){
                    var obj = a[k].summary;
                    var t = {
                        v: [],
                        total: 0,
                        n: 0,
                        weekly: 0
                    };
                    for(var s in obj){
                        if(s.length > 1) continue;//skip other
                        var so = obj[s];
                        if(so !== ''){
                            t.n++;
                            t.v.push(so);
                            t.total += parseFloat(so);
                        }
                    }

                    if(t.n > 0) t.weekly = t.total/t.n;

                    attendanceSummary.push(obj);
                    //console.log(JSON.stringify(t));
                }
            });

            console.log(require('prettyjson').render(xsre.getStudentSummary()));
            //console.log(require('prettyjson').render(transcript));
            //console.log(require('prettyjson').render(attendanceSummary));
      });

});

/**
 * Created by zaenal on 28/08/15.
 */
'use strict';
var fs = require('fs');
//var file = __dirname + '/data/cedarlabs';
var file = __dirname + '/../../data/raw';
var json = require(file);
var _ = require('underscore');
var l = require('lodash');

function processJson(student){
    var xSre = l.get(student, 'xSre');
    var students = {
        id: student.organization.refId,
        org_name: student.organization.organizationName,
        student_id: student.id,
        school_district: (student.organization.zoneId + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1){
            return $1.toUpperCase();
        }),
        school: "",
        first_name: "",
        last_name: "",
        grade_level: "",
        ethnicity: "",
        gender: ""
    };

    if(xSre){
        students.gender = l.get(xSre, 'demographics.sex');
        students.school = l.get(xSre, 'enrollment.school.schoolName');
        students.first_name = l.get(xSre, 'name.givenName');
        students.last_name = l.get(xSre, 'name.familyName');
        students.grade_level = l.get(xSre, 'enrollment.gradeLevel');
        students.ethnicity = l.get(xSre, 'demographics.races.race.race');
    }

    var studentPrograms = {};
    var studentProgramData = [];

    if(student.studentActivity){
        if(_.isObject(student.studentActivity)){
            _.values(student.studentActivity).forEach(function(programs){
                if(programs.title){
                    studentPrograms[programs.refId] = programs.title;
                }
            });
        }
    }

    if(student.programs && student.programs.activities && student.programs.activities.activity){
        if(_.isObject(student.programs.activities.activity)){
            _.values(student.programs.activities.activity).forEach(function(activity){
                if(activity.studentActivityRefId in studentPrograms){
                    var tags = [];
                    if(activity.tags){
                        if(_.isObject(activity.tags.tag)){
                            console.log('Object');
                            tags = _.values(activity.tags.tag);
                        } else{
                            tags = activity.tags.tag;
                        }
                    }
                    studentProgramData.push({
                        program_id: activity.studentActivityRefId,
                        student_id: students.student_id,
                        program_name: studentPrograms[activity.studentActivityRefId],
                        cohorts: tags.join(",")
                    });
                }
            });
        }
    }
    //console.log(students);
    console.log('STUDENTS: ', students);
    console.log('STUDENT PROGRAMS: ', studentProgramData);
}
json.forEach(processJson);

'use strict';
/**
 * Created by zaenal on 28/08/15.
 */
var moment = require('moment');
var _ = require('underscore');
var l = require('lodash');
/**
 *
 * @param xsre
 * @constructor
 */
function Transcript(xsre){

    var me = this;

    me.config = xsre.config;

    me.transcriptTerm = null;

    me.transcriptTermOther = null;

    me.enrollments = xsre.json.enrollment ? [xsre.json.enrollment] : [];

    me.transcriptFilterMark = [];

    if(xsre.json.otherEnrollments && _.isArray(xsre.json.otherEnrollments.enrollment)){

        _.each(xsre.json.otherEnrollments.enrollment, function(enrollment){

            me.enrollments.push(enrollment);

        });
    }

    if(xsre.json) {

        if(xsre.json.transcriptTerm) {
            me.transcriptTerm = xsre.json.transcriptTerm;
        }

        if(xsre.json.otherTranscriptTerms && xsre.json.otherTranscriptTerms.transcriptTerm) {
            me.transcriptTermOther = xsre.json.otherTranscriptTerms.transcriptTerm;
        }

    }

    me.extractRawSource = xsre.extractRawSource;

    me.subject = [];

    me.history = [];

    me.course = {};

    //me.notAvailable = 'N/A';
    me.notAvailable = '';

    me.academicSummary = {
        totalCreditsEarned: 0,
        totalCreditsAttempted: 0,
        termWeightedGpa: 0,
        cumulativeGpa: 0,
        termCreditsEarned: 0,
        termCreditsAttempted: 0,
        classRank: 0,
        gpaScale: 0
    };

    me.facets = xsre.facets;

    var scedId = {};

    var scedSort = [];

    for(var k = 1; k <= 23; k++){

        var nk = k < 10 ? '0'+k : ''+k;

        scedId[nk] = xsre.config.scedCourseSubjectAreaCode[nk].definition;

        scedSort.push(xsre.config.scedCourseSubjectAreaCode[nk].definition);

    }

    me.scedId = scedId;

    me.scedSort = scedSort;

    me.scedNotFound = {};

    me.totalCreditsEarned = 0;

    me.totalCreditsAttempted = 0;

    me.gradeLevel = me.notAvailable;

    me.credits = 1;

    me.totalCreditsAttempted = 0;

    me.info = { totalEarned: 0, totalAttempted: 0, gradeLevel: 0, currentSchoolYear: null, courseTitle: [] };

}
/**
 *
 * @returns {Array}
 */
Transcript.prototype.getHistory = function(){

    var me = this;

    if(me.enrollments.length > 0){

        var schools = [];

        var histories = [];

        _.each(me.enrollments, function(enrollment){

            var school = enrollment.school;

            var schoolName = l.get(school, 'schoolName');

            var schoolYear = enrollment.schoolYear || me.notAvailable;

            if(schoolName && schools.indexOf(schoolName) === -1){

                schools.push(schoolName);

            }

            var his = { leaRefId: enrollment.leaRefId, schoolRefId: enrollment.schoolRefId, schoolName: schoolName, schoolYear: schoolYear };

            var status = null;

            var description = null;

            if('enrollmentStatus' in enrollment){

                status = enrollment.enrollmentStatus || me.notAvailable;

            } else if('psesd:enrollmentStatus' in enrollment){

                status = enrollment['psesd:enrollmentStatus'] || me.notAvailable;

            }

            if(status && 'EnrollmentStatus' in me.config && status in me.config.EnrollmentStatus){

                description = l.get(me.config.EnrollmentStatus[status], 'description') || me.notAvailable;

            } else {

                description = me.notAvailable;

            }

            if(description === me.notAvailable){

                if('raw:source' in enrollment && enrollment['raw:source']){

                    _.each(enrollment['raw:source'], function(value, key){

                        var ikey = (key+'').substring(4);

                        if('enrollmentStatusDescription' === ikey){

                            description = value;

                        }

                    });

                }

            }

            his.schoolName = l.get(enrollment, 'school.schoolName') || me.notAvailable;
            his.projectedGraduationYear = l.get(enrollment, 'projectedGraduationYear') || me.notAvailable;
            his.gradeLevel = l.get(enrollment, 'gradeLevel') || me.notAvailable;
            his.entryDate = l.get(enrollment, 'entryDate') || me.notAvailable;
            his.exitDate = l.get(enrollment, 'exitDate') || me.notAvailable;
            his.membershipType = l.get(enrollment, 'membershipType') || me.notAvailable;
            his.enrollmentStatus = status || me.notAvailable;
            his.enrollmentStatusDescription = description || me.notAvailable;
            var entryDate = moment(his.entryDate);
            if(his.entryDate !== me.notAvailable && entryDate.isValid()){
                his.entryDate = entryDate.format('MM/DD/YYYY');
            }
            var exitDate = moment(his.exitDate);
            if(his.exitDate !== me.notAvailable && exitDate.isValid()){
                his.exitDate = exitDate.format('MM/DD/YYYY');
                his.exitDateTime = exitDate.valueOf();
            }

            /**
             * Check Non-promotional changes
             */

            me.history.push(his);

        });



    }

    var historiesPromotionChanges = _.sortBy(me.history, 'exitDateTime');
    var currentSchoolId = null;
    historiesPromotionChanges = _.map(historiesPromotionChanges, function(history){
        history.nonPromotionalChange = false;
        if(currentSchoolId === null){
            currentSchoolId = history.schoolId;
        }

        if(history.schoolId !== currentSchoolId){
            history.nonPromotionalChange = true;
        }

        currentSchoolId = history.schoolId;
        return history;
    });

    return historiesPromotionChanges;
};
/**
 *
 * @returns {Array}
 */
Transcript.prototype.getTranscript = function(){

    var me = this;

    if(null !== me.transcriptTerm) {

        me.info.currentSchoolYear = me.transcriptTerm.schoolYear;

        me.processTranscript(me.transcriptTerm, true);

    }


    if(null !== me.transcriptTermOther) {

        _.each(me.transcriptTermOther, function (transcript) {

            me.processTranscript(transcript, false);

        });

    }

    /**
     * Verify the data
     */

    var subjectModified = [];

    var subjectObject = {};

    _.each(me.scedSort, function(scedId){

        if(me.subject.indexOf(scedId) !== -1){

            subjectModified.push(scedId);

            subjectObject[scedId] = 0;

        }

    });
    /**
     * Add sort when scedAreaCode not in map config
     * @see src/lib/xsre/config.js
     *
     */
    if(Object.keys(me.scedNotFound).length > 0){

        _.each(_.sortBy(Object.keys(me.scedNotFound)), function(scedId){

            if(me.subject.indexOf(scedId) !== -1){

                subjectModified.push(scedId);

                subjectObject[scedId] = 0;

            }

        });

    }

    me.subject = subjectModified;

    //console.log(me.subject);

    me.course = _.sortBy(me.course, function(o){
        return o.startDateTime * -1;
    });



    //console.log(me.history);

    _.each(me.course, function(course){

        var courseTranscripts = {};

        //me.history.push({ schoolName: course.schoolName, schoolYear: course.schoolYear });

        if(_.isObject(course.transcripts)) {

            _.each(me.subject, function (subject, i) {

                if (Object.keys(course.transcripts).indexOf(subject) === -1) {

                    courseTranscripts[subject] = null;

                } else {

                    courseTranscripts[subject] = course.transcripts[subject];

                    courseTranscripts[subject].index = i;

                    courseTranscripts[subject].forEach(function(c){

                        subjectObject[subject] += c.creditsAttempted;

                        me.info.totalAttempted += c.creditsAttempted;

                        me.info.totalEarned += c.creditsEarned;

                        c.index = i;

                    });

                }

            });

        }

        course.transcripts = courseTranscripts;

    });

    var subjectValues = [];

    _.each(subjectModified, function(s){

        subjectValues.push({ name: s, value: parseFloat(subjectObject[s]).toFixed(1) });

    });

    me.info.totalAttempted = parseFloat(me.info.totalAttempted).toFixed(1);
    me.info.totalEarned = parseFloat(me.info.totalEarned).toFixed(1);

    if(me.academicSummary.termCreditsAttempted === 0 && me.academicSummary.totalCreditsEarned === 0){

        me.totalCreditsAttempted = me.info.totalAttempted;

        me.totalCreditsEarned = me.info.totalEarned;

    }

    if(me.gradeLevel === me.notAvailable){

        me.gradeLevel = me.info.gradeLevel;

    }

    return {
        //history: me.getHistory().reverse(), // handle in general/personal
        details: me.course,
        credits: me.credits,
        subject: subjectModified,
        subjectValues: subjectValues,
        totalCreditsEarned: isNaN(me.totalCreditsEarned) ? 0 : parseFloat(me.totalCreditsEarned).toFixed(1),
        totalCreditsAttempted: isNaN(me.totalCreditsAttempted) ? 0 : parseFloat(me.totalCreditsAttempted).toFixed(1),
        totalCumulativeGpa: me.academicSummary.cumulativeGpa.toFixed(1),
        gradeLevel: me.gradeLevel,
        academicSummary: me.academicSummary,
        info: me.info
    };
};
/**
 *
 * @param transcript
 * @param current
 */
Transcript.prototype.processTranscript = function(transcript, current){

    var me = this;

    if(!_.isObject(transcript.courses)){

        return;

    }


    var tSchoolYear = l.get(transcript, 'schoolYear');
    var tSession = l.get(transcript, 'session.description');
    var tSchoolName = l.get(transcript, 'school.schoolName');


    if(_.isUndefined(transcript.courses.course)){

        return ;

    }

    if(!_.isArray(transcript.courses.course)){

        transcript.courses.course = [ transcript.courses.course ];

    }

    if(current) {

        _.each(transcript.courses.course, function (course) {

            if (!course) {
                return;
            }

            if (!course.leaCourseId) {
                return;
            }

            if(course.courseTitle && me.info.courseTitle.indexOf(course.courseTitle) === -1){
                me.info.courseTitle.push(course.courseTitle);
            }

        });

    }

    var summary = {
        totalCreditsEarned: 0,
        totalCreditsAttempted: 0,
        termWeightedGpa: 0,
        cumulativeGpa: 0,
        termCreditsAttempted: 0,
        termCreditsEarned: 0,
        classRank: 0,
        gpaScale: 0
    };

    if(typeof transcript.academicSummary === 'object'){

        //transcript.academicSummary = me.extractRawSource(transcript.academicSummary);

        if(!_.isEmpty(transcript.academicSummary.totalCreditsEarned) && !isNaN(transcript.academicSummary.totalCreditsEarned)) {
            summary.totalCreditsEarned = parseFloat(transcript.academicSummary.totalCreditsEarned);
        }
        if(!_.isEmpty(transcript.academicSummary.totalCreditsAttempted) && !isNaN(transcript.academicSummary.totalCreditsAttempted)) {
            summary.totalCreditsAttempted = parseFloat(transcript.academicSummary.totalCreditsAttempted);
        }
        if(!_.isEmpty(transcript.academicSummary.termWeightedGpa) && !isNaN(transcript.academicSummary.termWeightedGpa)) {
            summary.termWeightedGpa = parseFloat(transcript.academicSummary.termWeightedGpa);
        }
        if(!_.isEmpty(transcript.academicSummary.cumulativeGpa) && !isNaN(transcript.academicSummary.cumulativeGpa)) {
            summary.cumulativeGpa = parseFloat(transcript.academicSummary.cumulativeGpa);
        }
        if(!_.isEmpty(transcript.academicSummary.termCreditsEarned) && !isNaN(transcript.academicSummary.termCreditsEarned)) {
            summary.termCreditsEarned = parseFloat(transcript.academicSummary.termCreditsEarned);
        }
        if(!_.isEmpty(transcript.academicSummary.termCreditsAttempted) && !isNaN(transcript.academicSummary.termCreditsAttempted)) {
            summary.termCreditsAttempted = parseFloat(transcript.academicSummary.termCreditsAttempted);
        }
        if(!_.isEmpty(transcript.academicSummary.classRank) && !isNaN(transcript.academicSummary.classRank)) {
            summary.classRank = parseFloat(transcript.academicSummary.classRank);
        }
        if(!_.isEmpty(transcript.academicSummary.gpaScale) && !isNaN(transcript.academicSummary.gpaScale)) {
            summary.gpaScale = parseFloat(transcript.academicSummary.gpaScale);
        }

        me.academicSummary.totalCreditsEarned += summary.totalCreditsEarned;
        me.academicSummary.totalCreditsAttempted += summary.totalCreditsAttempted;
        me.academicSummary.termWeightedGpa += summary.termWeightedGpa;
        me.academicSummary.cumulativeGpa += summary.cumulativeGpa;
        me.academicSummary.termCreditsAttempted += summary.termCreditsAttempted;
        me.academicSummary.termCreditsEarned += summary.termCreditsEarned;
        me.academicSummary.classRank += summary.classRank;
        me.academicSummary.gpaScale += summary.gpaScale;

    }

    //transcript = me.extractRawSource(transcript);

    //console.log(transcript);

    if(!tSchoolName || !tSession || !tSchoolYear){

        return;

    }

    var key = (tSchoolYear + ':' + tSession + ':' + tSchoolName).trim(), info = {
        gradeLevel : transcript.gradeLevel,
        schoolYear : tSchoolYear,
        schoolName : tSchoolName,
        startDate: l.get(transcript, 'session.startDate'),
        startDateTime: 0,
        session: tSession,
        transcripts: {},
        summary: summary
    };

    if(info.startDate){
        info.startDateTime = new Date(info.startDate).getTime();
    } else {
        info.startDate = info.tSchoolYear;
        info.startDateTime = new Date(info.startDate).getTime();
    }

    if(parseInt(me.info.gradeLevel) < parseInt(info.gradeLevel)){

        me.info.gradeLevel = info.gradeLevel;

    }

    if(Object.keys(me.course).indexOf(key) === -1) {
        me.course[key] = info;
    }


    _.each(transcript.courses.course, function (course) {

        if(!course) {
            return;
        }

        if(!course.leaCourseId) {
            return;
        }

        var uniqueId = course.scedCourseSubjectAreaCode;

        if(uniqueId in me.scedId) {

            me.transcriptWithSCED(uniqueId, key, course, info, current);

        } else {

            me.transcriptWithNoSCED(uniqueId, key, course, info, current);

        }

    });


};
/**
 *
 * @param scedAreaCode
 * @param key
 * @param course
 * @param info
 * @param current
 */
Transcript.prototype.transcriptWithSCED = function(scedAreaCode, key, course, info, current){

    var me = this;

    var uniqueStr = me.scedId[scedAreaCode];

    if (Object.keys(me.course[key].transcripts).indexOf(uniqueStr) === -1) {
        me.course[key].transcripts[uniqueStr] = [];
    }

    if(me.subject.indexOf(uniqueStr) === -1) {
        me.subject.push(uniqueStr);
    }

    var mark = null;

    mark = course.progressMark || course.finalMarkValue;

    if(!mark) {

        mark = '';

    }

    var icheck = key + '+' + uniqueStr + '+' + (course.courseTitle || me.notAvailable);

    if(me.transcriptFilterMark.indexOf(icheck) !== -1){

        return;

    }

    me.transcriptFilterMark.push(icheck);

    if(me.course[key].academicSummary){

        if(!('totalCreditsEarned' in me.course[key].academicSummary)){
            me.course[key].academicSummary.totalCreditsEarned = 0;
        }
        if(!('totalCreditsAttempted' in me.course[key].academicSummary)){
            me.course[key].academicSummary.totalCreditsAttempted = 0;
        }
        if(!('termCreditsEarned' in me.course[key].academicSummary)){
            me.course[key].academicSummary.termCreditsEarned = 0;
        }
        if(!('termCreditsAttempted' in me.course[key].academicSummary)){
            me.course[key].academicSummary.termCreditsAttempted = 0;
        }

        me.course[key].academicSummary.totalCreditsEarned += isNaN(course.creditsEarned) ? 0 : parseFloat(course.creditsEarned);
        me.course[key].academicSummary.totalCreditsAttempted += isNaN(course.creditsAttempted) ? 0 : parseFloat(course.creditsAttempted);

        me.course[key].academicSummary.termCreditsEarned += isNaN(course.creditsEarned) ? 0 : parseFloat(course.creditsEarned);
        me.course[key].academicSummary.termCreditsAttempted += isNaN(course.creditsAttempted) ? 0 : parseFloat(course.creditsAttempted);

    }

    me.course[key].transcripts[uniqueStr].push({
        index: null,
        n: me.course[key].transcripts[uniqueStr].length + 1,
        cdesId: scedAreaCode,
        courseId: course.leaCourseId,
        title: course.courseTitle || me.notAvailable,
        mark: mark,
        gradeLevel: info.gradeLevel || me.notAvailable,
        creditsEarned: isNaN(course.creditsEarned) ? 0 : parseFloat(course.creditsEarned),
        creditsAttempted: isNaN(course.creditsAttempted) ? 0 : parseFloat(course.creditsAttempted)
    });

};
/**
 *
 * @param scedAreaCode
 * @param key
 * @param course
 * @param info
 * @param current
 */
Transcript.prototype.transcriptWithNoSCED = function(scedAreaCode, key, course, info, current){

    var me = this;

    var uniqueStr = scedAreaCode;

    if(Object.keys(me.scedNotFound).indexOf(scedAreaCode) === -1){
        me.scedNotFound[scedAreaCode] = [];
    }

    if (Object.keys(me.course[key].transcripts).indexOf(uniqueStr) === -1) {
        me.course[key].transcripts[uniqueStr] = [];
    }

    if(me.subject.indexOf(uniqueStr) === -1) {
        me.subject.push(uniqueStr);
    }

    var mark = null;


    mark = course.progressMark || course.finalMarkValue;

    if(!mark) {

        mark = '';

    }

    if(me.course[key].academicSummary){

        if(!('totalCreditsEarned' in me.course[key].academicSummary)){
            me.course[key].academicSummary.totalCreditsEarned = 0;
        }
        if(!('totalCreditsAttempted' in me.course[key].academicSummary)){
            me.course[key].academicSummary.totalCreditsAttempted = 0;
        }
        if(!('termCreditsEarned' in me.course[key].academicSummary)){
            me.course[key].academicSummary.termCreditsEarned = 0;
        }
        if(!('termCreditsAttempted' in me.course[key].academicSummary)){
            me.course[key].academicSummary.termCreditsAttempted = 0;
        }

        me.course[key].academicSummary.totalCreditsEarned += isNaN(course.creditsEarned) ? 0 : parseFloat(course.creditsEarned);
        me.course[key].academicSummary.totalCreditsAttempted += isNaN(course.creditsAttempted) ? 0 : parseFloat(course.creditsAttempted);

        me.course[key].academicSummary.termCreditsEarned += isNaN(course.creditsEarned) ? 0 : parseFloat(course.creditsEarned);
        me.course[key].academicSummary.termCreditsAttempted += isNaN(course.creditsAttempted) ? 0 : parseFloat(course.creditsAttempted);

    }

    me.course[key].transcripts[uniqueStr].push({
        index: null,
        n: me.course[key].transcripts[uniqueStr].length + 1,
        cdesId: scedAreaCode,
        courseId: course.leaCourseId,
        title: course.courseTitle || me.notAvailable,
        mark: mark,
        gradeLevel: info.gradeLevel || me.notAvailable,
        creditsEarned: isNaN(course.creditsEarned) ? 0 : parseFloat(course.creditsEarned),
        creditsAttempted: isNaN(course.creditsAttempted) ? 0 : parseFloat(course.creditsAttempted)
    });

};



module.exports = Transcript;
'use strict';
/**
 * Created by zaenal on 31/08/15.
 */
var moment = require('moment');
var Transcript = require(__dirname + '/xsre/transcript');
var Attendance = require(__dirname + '/xsre/attendance');
var Report = require(__dirname + '/xsre/report');
var Assessment = require(__dirname + '/xsre/assessment');
var Personal = require(__dirname + '/xsre/personal');
var CodeSet = require(__dirname + '/xsre/codeset');
var _ = require('lodash');
var pd = require('pretty-data').pd;
/**
 * @constructor
 * @param result
 * @param raw
 * @param separate
 * @param params
 */
function xSre(result, raw, separate, params){

    this.params = params || {};

    this.config = new CodeSet().get();

    if(result.payload && result.payload.response){

        this.json = result.payload.response.xSre;

    } else {

        this.json = result.xSre;

    }

    this.raw = raw;

    this.separate = separate || 'xsre';


    this.facets = {
        '13297': 'Disciplinary action, not receiving instruction',
        '13299': 'Family activity',
        '13296': 'Family emergency or bereavement',
        '13295': 'Illness, injury, health treatment, or examination',
        '13298': 'Legal or judicial requirement',
        '13293': 'Noninstructional activity recognized by state or school',
        '13294': 'Religious observation',
        '13303': 'Situation unknown',
        '13300': 'Student employment',
        '13302': 'Student is skipping school',
        '13301': 'Transportation not available',

        /**
         * Present
         */
        '13290': 'Disciplinary action, receiving instruction',
        '13288': 'In school, regular instructional program',
        '13289': 'Nontraditional school setting, regular instructional program',
        '13291': 'Out of school, regular instructional program activity',
        '13292': 'Out of school, school-approved extracurricular or cocurricular activity',
        /**
         * disciplineIncidents
         */
        '04618': 'Alcohol',
        '04625': 'Arson',
        '04626': 'Attendance Policy Violation',
        '04632': 'Battery',
        '04633': 'Burglary/Breaking and Entering',
        '04634': 'Disorderly Conduct',
        '04635': 'Drugs Excluding Alcohol and Tobacco',
        '04645': 'Fighting',
        '13354': 'Harassment or bullying on the basis of disability',
        '13355': 'Harassment or bullying on the basis of race, color, or national origin',
        '13356': 'Harassment or bullying on the basis of sex',
        '04646': 'Harassment, Nonsexual',
        '04650': 'Harassment, Sexual',
        '04651': 'Homicide',
        '04652': 'Inappropriate Use of Medication',
        '04659': 'Insubordination',
        '04660': 'Kidnapping',
        '04661': 'Obscene Behavior',
        '04669': 'Physical Altercation, Minor',
        '04670': 'Robbery',
        '04671': 'School Threat',
        '04677': 'Sexual Battery (sexual assault)',
        '04678': 'Sexual Offenses, Other (lewd behavior, indecent exposure)',
        '04682': 'Theft',
        '04686': 'Threat/Intimidation',
        '04692': 'Tobacco Possession or Use',
        '04699': 'Trespassing',
        '04700': 'Vandalism',
        '04704': 'Violation of School Rules',
        '04705': 'Weapons Possession',
        'DailyAttendance': 'Daily attendance',
        'ClassSectionAttendance': 'Class/section attendance',
        'ProgramAttendance': 'Program attendance',
        'ExtracurricularAttendance': 'Extracurricular attendance',

        'Present': 'Present',
        'ExcusedAbsence': 'Not present but is temporarily excused from attendance because the person is: 1) is ill and attendance would endanger his or her health or the health of others; 2) has an immediate family member who is seriously ill or has died; 3) is observing a recognized religious holiday of his or her faith; or 4) is otherwise excused in accordance with policies.',
        'UnexcusedAbsence': 'Not present without acceptable cause or authorization.',
        'Tardy': 'Is absent at the time a given schedule when attendance begins but is present before the close of that time period.',
        'EarlyDeparture': 'Leaves before the official close of the daily session. Reasons may include a special activity for curricular enrichment, doctor\'s appointment, and family emergency. State, local, and school regulations may distinguish excused and unexcused early departures. When officially approved on a regular basis, early departures immediately prior to the close of the session are considered to be released time.',
        'Unknown': 'Unknown'
    };

    if('$' in this.json) {

        delete this.json.$;

    }

    this.justlog = {
        info: function(){},
        debug: function(){},
        warn: function(){},
        error: function(){}
    };

}
/**
 *
 * @param justlog
 * @returns {xSre}
 */
xSre.prototype.setLogger = function(justlog){
    this.justlog = justlog;
    return this;
};
/**
 *
 * @returns {*}
 */
xSre.prototype.getTranscript= function(){
    this.justlog.info('XSRE - START TRANSCRIPT');
    return new Transcript(this);
    
};
xSre.prototype.getReport= function(){
    this.justlog.info('XSRE - START REPORT');
    return new Report(this);

};
/**
 *
 * @returns {*}
 */
xSre.prototype.getJson = function(){
    this.justlog.info('XSRE - GET JSON');
    return this.json;

};

xSre.prototype.getStudentSummary = function(){
    this.justlog.info('XSRE - START STUDENT SUMMARY');
    var summary = {
        gradeLevel: "",
        schoolYear: "",
        schoolName: "",
        attendanceCount: [],
        behaviorCount: [],
        attendanceRiskFlag: [],
        onTrackToGraduate: "",
        latestDate: "",
        latestDateTime: ""
    };

    var json = this.getJson();

    var personal = this.getPersonal().getPersonal();

    if(personal && personal.xSre.enrollment){
        summary.gradeLevel = personal.xSre.enrollment.gradeLevel;
        summary.schoolYear = personal.xSre.enrollment.schoolYear;
        summary.schoolName = personal.xSre.enrollment.schoolName;
    }

    var attendance = this.getAttendanceBehavior();

    summary.attendanceCount = attendance.getCurrentTotalAttendance();
    summary.behaviorCount = attendance.getCurrentTotalBehavior();
    summary.attendanceRiskFlag = attendance.getRiskFlag();
    var attendanceSummary = attendance.calculateSummary();
    summary.latestDate = attendanceSummary.date.latest;
    summary.latestDateTime = attendanceSummary.date.max;
    summary.onTrackToGraduate = null;

    var academicSummary = _.get(json, 'transcriptTerm.academicSummary');

    if(academicSummary){
        if('onTrackToGraduate' in academicSummary){
            summary.onTrackToGraduate = academicSummary.onTrackToGraduate;
        } else if('psesd:onTrackToGraduate' in academicSummary) {
            summary.onTrackToGraduate = academicSummary['psesd:onTrackToGraduate'];
        }
    }

    return summary;

};
/**
 *
 * @returns {Attendance}
 */
xSre.prototype.getAttendanceBehavior = function(){
    this.justlog.info('XSRE - START ATTENDANCE');
    return new Attendance(this);

};
/**
 *
 * @returns {Assessment}
 */
xSre.prototype.getAssessment = function(){
    this.justlog.info('XSRE - START ASSESSMENT');
    return new Assessment(this);

};
/**
 *
 * @returns {Personal}
 */
xSre.prototype.getPersonal = function(){
    this.justlog.info('XSRE - START PERSONAL');
    return new Personal(this);

};
/**
 *
 * @param object
 * @returns {*}
 */
xSre.prototype.extractRawSource = function(object){

    return object;

};
/**
 *
 * @returns {*}
 */
xSre.prototype.toObject = function(){

    this.justlog.info('XSRE - START TO JSON');

    var json = this.json;

    if(this.separate === 'general'){

        json.personal = this.getPersonal().getPersonal();

        if(json.assessments){

            delete json.assessments;

        }

    } else {

        var attendance = this.getAttendanceBehavior();

        json.attendanceBehaviors = attendance.getAttendances();

        json.attendanceYears = attendance.getAvailableYears();

        json.transcripts = this.getTranscript().getTranscript();

        json.assessments = this.getAssessment().getAssessment();

        json.personal = this.getPersonal().getPersonal();

    }

    json.lastUpdated = moment().format('MM/DD/YYYY HH:mm:ss');

    this.justlog.info('XSRE - START SET RAW');

    json.raw = pd.xml(this.raw);

    this.justlog.info('XSRE - REMOVE UNNECESSARY');
    /**
     * Delete unnecessary the data
     */
    if(json.attendance) {
        delete json.attendance;
    }

    if(json.languages) {
        delete json.languages;
    }

    if(json.enrollment) {
        delete json.enrollment;
    }

    if(json.demographics) {
        delete json.demographics;
    }

    if(json.otherEnrollments) {
        delete json.otherEnrollments;
    }

    if(json.otherTranscriptTerms) {
        delete json.otherTranscriptTerms;
    }

    if(json.phoneNumber) {
        delete json.phoneNumber;
    }

    if(json.name) {
        delete json.name;
    }

    if(json.otherIds) {
        delete json.otherIds;
    }

    if(json.programs) {
        delete json.programs;
    }

    if(json.transcriptTerm) {
        delete json.transcriptTerm;
    }

    if(json.disciplineIncidents) {
        delete json.disciplineIncidents;
    }
    this.justlog.info('XSRE - RETURN RESULT');
    return json;

};


/**
 *
 * @type {xSre}
 */
module.exports = xSre;
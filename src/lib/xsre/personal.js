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
function Personal(xsre){

    var me = this;

    me.xSre = xsre.json;

    me.config = xsre.config;

    me.personal = {};

    //me.notAvailable = 'N/A';
    me.notAvailable = '';
    me.enrollmentHistories = xsre.getTranscript().getHistory().reverse();
    me.personal.summary = xsre.getAttendanceBehavior().calculateSummary();


}
/**
 *
 * @returns {Array}
 */
Personal.prototype.getPersonal = function(){

    var me = this;
    me.personal.firstName = null;
    me.personal.middleName = null;
    me.personal.lastName = null;
    me.personal.schoolDistrict = null;
    me.personal.collegeBound = null;
    me.personal.phone = null;
    me.personal.email = null;
    me.personal.address = null;
    me.personal.emergency1 = {
        name: null,
        relationship: null,
        email: null,
        phone: null,
        mentor: null
    };
    me.personal.emergency2 = {
        name: null,
        relationship: null,
        email: null,
        phone: null,
        mentor: null
    };
    var races = l.get(me.xSre, 'demographics.races.race.race', []);
    if(!_.isArray(races)){
        races = [ races ];
    }
    me.personal.xSre = {
        localId: l.get(me.xSre, 'localId') || me.notAvailable,
        demographics: {
            races: races,
            hispanicLatinoEthnicity: l.get(me.xSre, 'demographics.hispanicLatinoEthnicity') || me.notAvailable,
            sex: l.get(me.xSre, 'demographics.sex') || me.notAvailable,
            birthDate: l.get(me.xSre, 'demographics.birthDate') || me.notAvailable
        },
        email: [],
        address: l.get(me.xSre, 'address') || null,
        phoneNumber: [],
        languages: [],
        enrollment: {},
        otherEnrollments: me.enrollmentHistories
    };

    var phoneNumber = l.get(me.xSre, 'phoneNumber');
    if(l.get(phoneNumber, 'number')){
        me.personal.xSre.phoneNumber.push(phoneNumber);
    }

    l.get(me.xSre, 'otherPhoneNumbers.phoneNumber', []).forEach(function(phoneNumber){
        if(l.get(phoneNumber, 'number')){
            me.personal.xSre.phoneNumber.push(phoneNumber);
        }
    });

    var email = l.get(me.xSre, 'email');
    if(l.get(email, 'emailAddress')){
        me.personal.xSre.email.push(email);
    }
    l.get(me.xSre, 'otherEmails.email', []).forEach(function(email){
        if(l.get(email, 'emailAddress')){
            me.personal.xSre.email.push(email);
        }
    });
    /**
     * Check XSRE
     * @type {null}
     */
    me.personal.xSre.enrollment = {};
    me.personal.xSre.languages = [];
    me.personal.xSre.enrollment.leaRefId = l.get(me.xSre, 'enrollment.leaRefId') || me.notAvailable;
    me.personal.xSre.enrollment.schoolRefId = l.get(me.xSre, 'enrollment.schoolRefId') || me.notAvailable;
    me.personal.xSre.enrollment.schoolYear = l.get(me.xSre, 'enrollment.schoolYear') || me.notAvailable;
    me.personal.xSre.enrollment.schoolName = l.get(me.xSre, 'enrollment.school.schoolName') || me.notAvailable;
    me.personal.xSre.enrollment.membershipType = l.get(me.xSre, 'enrollment.membershipType') || me.notAvailable;
    me.personal.xSre.enrollment.projectedGraduationYear = l.get(me.xSre, 'enrollment.projectedGraduationYear') || me.notAvailable;
    me.personal.xSre.enrollment.gradeLevel = l.get(me.xSre, 'enrollment.gradeLevel') || me.notAvailable;
    me.personal.xSre.enrollment.entryDate = l.get(me.xSre, 'enrollment.entryDate') || me.notAvailable;
    me.personal.xSre.enrollment.exitDate = l.get(me.xSre, 'enrollment.exitDate') || me.notAvailable;
    me.personal.xSre.enrollment.enrollmentStatus = me.notAvailable;
    me.personal.xSre.enrollment.enrollmentStatusDescription = me.notAvailable;


    var enrollment = l.get(me.xSre, 'enrollment') || [];

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
    me.personal.xSre.enrollment.enrollmentStatus = status;
    me.personal.xSre.enrollment.enrollmentStatusDescription = me.notAvailable;

    /**
     *
     */
    me.personal.daysInAttendance = l.get(me.xSre, 'attendance.summaries.summary.daysInAttendance') || me.notAvailable;
    me.personal.daysAbsent = l.get(me.xSre, 'attendance.summaries.summary.daysAbsent') || me.notAvailable;
    me.personal.section504Status = l.get(me.xSre, 'programs.specialEducation.section504Status') || me.notAvailable;
    me.personal.eligibilityStatus = l.get(me.xSre, 'programs.foodService.eligibilityStatus') || me.notAvailable;
    me.personal.enrollmentStatus = l.get(me.xSre, 'programs.foodService.enrollmentStatus') || me.notAvailable;
    var specialEducationServices = l.get(me.xSre, 'programs.specialEducation.services');

    if(_.isArray(specialEducationServices)){
        specialEducationServices = specialEducationServices[0];
    }
    me.personal.ideaIndicator = l.get(specialEducationServices, 'service.ideaIndicator') || me.notAvailable;
    var languages = l.get(me.xSre, 'languages.language');

    if(_.isArray(languages) && languages.length > 1){

        languages.forEach(function(language){
            var newLang = { type: language.type, code: language.code, description: "" };
            var code = l.find(me.config.languageCode, function(o){
                return o.value === language.code;
            });
            if(code && code.description){
                newLang.description = code.description;
            }

            me.personal.xSre.languages.push(newLang);
        });

    }

    return me.personal;
};


/**
 *
 * @type {Personal}
 */
module.exports = Personal;
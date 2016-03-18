/**
 * Created by zaenal on 13/11/15.
 */
'use strict';
var rootPath = __dirname + '/../../';
var appPath = rootPath + 'app';
var libPath = rootPath + 'lib';
var async = require('async');
var request = require('request');
var qs = require('querystring');
var moment = require('moment');
var uuid = require('node-uuid');
var CryptoJS = require("crypto-js");
var TIME = 1321644961388;
var _ = require('underscore');
var l = require('lodash');
var utils = require(libPath+'/utils'), config = utils.config(), cache = utils.cache(), log = utils.log, md5 = utils.md5, benchmark = utils.benchmark();
/**
 *
 * @param options
 * @param env
 * @constructor
 */
function Request(options, env){

    if(!config.has('hzb')){

        log("config HZ not found!", err);
        throw new Error("config HZ not found!");

    }

    this.options = options || {};

    this.config = config.get('hzb');

    this.env = env || 'dev';

    this.headers = {};

    this.lastPage = 0;

    this.body = [];

    this.sessionToken = null;

    this.secret = null;

}

Request.prototype = {

    constructor: Request,

    /**
     *
     * @param params
     */
    setQueryParameter: function(params){

        this.queryParameter = params;

    },

    /**
     *
     * @param param
     * @param val
     */
    addQueryParameter: function(param, val){

        this.queryParameter[param] = val;

    },

    /**
     *
     * @returns {{contextId: string}|*}
     */
    getQueryParameter: function(){

        return this.queryParameter;

    },

    /**
     *
     * @param headers
     */
    setHeaders: function(headers){

        this.headers = headers;

    },

    /**
     *
     * @param key
     * @param val
     */
    addHeader: function(key, val){

        this.headers[key] = val;

    },
    /**
     *
     * @returns {{}|*}
     */
    getHeaders: function(){

        return this.headers;

    },
    /**
     *
     * @param data
     * @param callback
     * @param zoneId
     * @returns {*}
     */
    push: function(data, callback, zoneId){

        var config = this.config.CBOStudent.push;

        this.secret = config.sharedSecret;

        this.sessionToken = config.sessionToken;

        var self = this;

        zoneId = zoneId || config.zoneId;

        var url = '/requestProvider/' + config.service1 + ';zoneId=' + zoneId + ';contextId=' + config.contextId;

        if('headers' in config){

            for(var name in config.headers){

                self.addHeader(name, config.headers[name]);

                if(name === 'requestType' && config.headers[name] === 'DELAYED'){

                    self.addHeader('queueId', uuid.v1({msecs: TIME + 1}));

                }

            }
        }
        self.addHeader('requestId', uuid.v1({msecs: TIME + 28*24*3600*1000}));

        self.create(config.url + url, 'POST', data, callback);
    },
    /**
     *
     * @returns {Request}
     */
    clearParam: function(){
        this.body = [];
        this.lastPage = 0;
        return this;
    },
    /**
     *
     * @param callback
     * @param serviceNumber
     * @param where
     * @param zoneId
     * @param headers
     */
    get: function(callback, serviceNumber, where, zoneId, headers){

        var config = this.config.CBOStudent.get;

        this.secret = config.sharedSecret;

        this.sessionToken = config.sessionToken;

        var serviceName = serviceNumber === 1 ? config.service1 : config.service2;

        zoneId = zoneId || config.zoneId;

        var url = '/requestProvider/' + serviceName + ';zoneId=' + zoneId + ';contextId=' + config.contextId;

        if(where){
            url += '?where='+where;
        }

        if(url.indexOf('?') === -1){
            url += '?';
        } else {
            url += '&';
        }

        url += 'json=true';

        this.headers.navigationpagesize = 10;

        if(!('noNavigationPage' in headers)){
            this.headers.queryIntention = 'ALL'; //(ALL, ONE-OFF, NO-CACHING)
        }

        if('noNavigationPage' in headers){
            delete headers.noNavigationPage;
        }

        var self = this;

        if('headers' in config){

            for(var name in config.headers){

                self.addHeader(name, config.headers[name]);

            }
        }

        if(headers){

            for(var name in headers){

                self.addHeader(name, headers[name]);

            }
        }

        self.create(config.url + url, 'GET', null, callback);

    },
    /**
     *
     * @param done
     */
    codeSet: function(done){

        var config = this.config.CBOStudent.get;

        this.secret = config.sharedSecret;

        this.sessionToken = config.sessionToken;

        var self = this;


        var url = '/requestProvider/codeSets';

        if('headers' in config){

            for(var name in config.headers){

                self.addHeader(name, config.headers[name]);

            }
        }

        self.create(config.url + url, 'GET', null, done);
    },
    /**
     *
     * @param done
     * @param serviceNumber
     * @param where
     * @param zoneId
     */
    getBulk: function(done, serviceNumber, where, zoneId){
        var me = this;
        var students = [];
        var studentPrograms = [];
        var navigationId = null;
        var pageId = 0;
        me.clearParam();
        /**
         *
         * @param studentList
         * @returns {Array}
         */
        function processStudent(studentList){
            var slist = [];
            if(studentList){
                _.each(studentList, function(student){
                    var xSre = l.get(student, 'xSre');
                    var s1 = {
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
                        s1.gender = l.get(xSre, 'demographics.sex');
                        s1.school = l.get(xSre, 'enrollment.school.schoolName');
                        s1.first_name = l.get(xSre, 'name.givenName');
                        s1.last_name = l.get(xSre, 'name.familyName');
                        s1.grade_level = l.get(xSre, 'enrollment.gradeLevel');
                        s1.ethnicity = l.get(xSre, 'demographics.races.race.race');
                    }
                    slist.push(s1);

                });
            }
            return slist;
        }

        /**
         *
         * @param studentList
         * @returns {Array}
         */
        function processStudentProgram(studentList){
            var slist = [];
            if(studentList){
                _.each(studentList, function(student){
                    var studentPrograms = {};

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
                                            tags = _.values(activity.tags.tag);
                                        } else{
                                            tags = activity.tags.tag;
                                        }
                                    }

                                    if(typeof tags === 'string' && tags !== ""){
                                        tags = [ tags ];
                                    }

                                    slist.push({
                                        program_id: activity.studentActivityRefId,
                                        student_id: student.id,
                                        program_name: studentPrograms[activity.studentActivityRefId],
                                        cohorts: _.isArray(tags) ? tags.join(",") : ""
                                    });
                                }
                            });
                        }
                    }
                });
            }
            return slist;
        }
        /**
         *
         * @param c
         */
        function grab(c){

            me.get(function(e, r, b){
                var ret = JSON.parse(b);
                students = students.concat(processStudent(ret));
                studentPrograms = studentPrograms.concat(processStudentProgram(ret));
                c();
                navigationId = r.headers.navigationid;
                pageId = parseInt(r.headers.navigationpage) + 1;
                if((parseInt(r.headers.navigationcount) === students.length) || r.headers.navigationlastpage === 'true'){
                    done(students, studentPrograms);
                } else {
                    grab(function(){
                        log(where + ' ::: On page: ' + pageId + ' =>  Student Get: ' + students.length + ' Student Program Get: ' + studentPrograms.length);
                    });
                }
            }, serviceNumber, where, zoneId, { navigationid: navigationId, navigationpage: pageId });
        }

        grab(function() {
            log(where + ' ::: On page: ' + pageId + ' =>  Student Get: ' + students.length + ' Student Program Get: ' + studentPrograms.length);
        });
    },
    /**
     *
     * @param storeStudent
     * @param storeStudentProgram
     * @param done
     * @param serviceNumber
     * @param where
     * @param zoneId
     */
    getBulkWithoutNavigationPage: function(storeStudent, storeStudentProgram, done, serviceNumber, where, zoneId){
        var me = this;
        //var students = [];
        //var studentPrograms = [];
        var totalStudent = 0;
        var totalStudentProgram = 0;
        var pageId = 0;
        me.clearParam();
        /**
         *
         * @param studentList
         * @returns {Array}
         */
        function processStudent(studentList){
            var slist = [];
            if(studentList.length > 0){
                _.each(studentList, function(student){
                    var xSre = l.get(student, 'xSre');
                    var s1 = {
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
                        s1.gender = l.get(xSre, 'demographics.sex');
                        s1.school = l.get(xSre, 'enrollment.school.schoolName');
                        s1.first_name = l.get(xSre, 'name.givenName');
                        s1.last_name = l.get(xSre, 'name.familyName');
                        s1.grade_level = l.get(xSre, 'enrollment.gradeLevel');
                        s1.ethnicity = l.get(xSre, 'demographics.races.race.race');
                    }
                    slist.push(s1);

                });
            }
            return slist;
        }

        /**
         *
         * @param studentList
         * @returns {Array}
         */
        function processStudentProgram(studentList){
            var slist = [];
            if(studentList.length > 0){
                _.each(studentList, function(student){
                    var studentPrograms = {};

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
                                            tags = _.values(activity.tags.tag);
                                        } else{
                                            tags = activity.tags.tag;
                                        }
                                    }

                                    if(typeof tags === 'string' && tags !== ""){
                                        tags = [ tags ];
                                    }

                                    slist.push({
                                        program_id: activity.studentActivityRefId,
                                        student_id: student.id,
                                        program_name: studentPrograms[activity.studentActivityRefId],
                                        cohorts: _.isArray(tags) ? tags.join(",") : ""
                                    });
                                }
                            });
                        }
                    }
                });
            }
            return slist;
        }
        /**
         *
         * @param c
         */
        function grab(c){

            me.get(function(e, r, b){
                var ret = [];
                try{
                    ret = JSON.parse(b);
                } catch(ex){
                    var msg = "";
                    if(ex instanceof Error){

                        msg += ex.stack.split("\n");

                    } else {

                        msg += ex + "";

                    }
                    msg += "\nError: ";
                    if(e instanceof Error){

                        msg += e.stack.split("\n");

                    } else {

                        msg += e + "";

                    }

                    msg += "\nBODY: " + b;

                    log(msg, 'error');
                }

                pageId++;
                if(ret.length === 0){
                    done(totalStudent, totalStudentProgram);
                } else {
                    var students = processStudent(ret);
                    var studentPrograms = processStudentProgram(ret);
                    totalStudent += students.length;
                    totalStudentProgram += studentPrograms.length;
                    c();
                    async.eachSeries(students, storeStudent, function(err){
                        if(err){
                            log(err, 'error');
                        }
                        async.eachSeries(studentPrograms, storeStudentProgram, function(err){
                            if(err){
                                log(err, 'error');
                            }
                            grab(function(){
                                log((where || 'All') + ' ::: On page: ' + pageId + ' =>  Total of Students Get: ' + totalStudent + ' Total of Student Programs Get: ' + totalStudentProgram);
                            });
                        });
                    });

                }
            }, serviceNumber, where, zoneId, { noNavigationPage: true, navigationpage: pageId });
        }

        grab(function() {
            log((where || 'All') + ' ::: On page: ' + pageId + ' =>  Total of Students Get: ' + totalStudent + ' Total of Student Programs Get: ' + totalStudentProgram);
        });
    },
    /**
     *
     * @param url
     * @param method
     * @param data
     * @param callback
     */
    create: function(url, method, data, callback){

        this.addHeader('messageId', this.generateUUID());

        var timestamp = this.headers.timestamp = this.getTimezone();

        var token = this._generateAuthToken(timestamp, this.sessionToken, this.secret);

        this.headers.Authorization = 'SIF_HMACSHA256 ' + token;

        var options = {
            method: method || 'GET',
            preambleCRLF: true,
            postambleCRLF: true,
            uri: url,
            headers: this.getHeaders()
        };

        //console.log('OPTIONS: ', JSON.stringify(options));
        //console.log('OPTIONS: ', (options));

        if(data){
            options.multipart = {
                chunked: true,
                data: [
                    {
                        'content-type': 'text/xml',
                        body: data
                    }
                ]
            };
        }


        request(options,
            function(error, response, body){
                //console.log(response.headers);
                if(error){
                    callback(error, response, body);
                    return log(error, 'error');
                }
                //console.log('Response Header:', JSON.stringify(response.headers));
                //console.log('Response STATUS CODE:', response.statusCode);
                //console.log('Server responded with:', body);
                callback(error, response, body);
            });
    },

    /**
     *
     * @returns {*|ServerResponse}
     */
    getTimezone: function(){

        return moment().utc().format("YYYY-MM-DDThh:mm:ss.SSSZZ");

    },

    /**
     *
     * @returns {*}
     */
    generateUUID: function(){

        return uuid.v1();

    },

    /**
     *
     * @param timestamp
     * @param sessionToken
     * @param secret
     * @returns {*|string}
     * @private
     */
    _generateAuthToken: function(timestamp, sessionToken, secret){

        var valToHash = sessionToken + ":" + timestamp;

        var hash = CryptoJS.HmacSHA256(valToHash, secret).toString(CryptoJS.enc.Base64);

        return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(sessionToken + ":" + hash));

    },

    /**
     *
     * @param timestamp
     * @returns {*|string}
     */
    generateSREAuthToken: function(timestamp){

        var sessionToken = this.config.sre.sessionToken;

        var secret = this.config.sre.sharedSecret;

        return this._generateAuthToken(timestamp, sessionToken, secret);

    },

    /**
     *
     * @param timestamp
     * @returns {*|string}
     */
    generateXSREAuthToken: function(timestamp){

        var sessionToken = this.config.xsre.sessionToken;

        var secret = this.config.xsre.sharedSecret;

        return this._generateAuthToken(timestamp, sessionToken, secret);

    },

    /**
     *
     * @param timestamp
     * @returns {*|string}
     */
    generatePRSAuthToken: function(timestamp){

        var sessionToken = this.config.prs.sessionToken;

        var secret = this.config.prs.sharedSecret;

        return this._generateAuthToken(timestamp, sessionToken, secret);

    }

};

/**
 *
 * @type {Request}
 */
module.exports = Request;

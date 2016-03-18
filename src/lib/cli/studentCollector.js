'use strict';
/**
 * Created by zaenal on 22/09/15.
 */
var mongoose = require('mongoose');
var rootPath = __dirname + '/../../';
var appPath = rootPath + 'app';
var libPath = rootPath + 'lib';
require(libPath + '/cli/db');
var Student = require(appPath+'/models/Student');
var StudentProgram = require(appPath+'/models/StudentProgram');
var Organization = require(appPath+'/models/Organization');
var Program = require(appPath+'/models/Program');
var User = require(appPath+'/models/User');
var Tag = require(appPath+'/models/Tag');
var _ = require('underscore');
var l = require('lodash');
var xmlParser = require('js2xmlparser');
var moment = require('moment');
var utils = require(libPath+'/utils'), cache = utils.cache(), log = utils.log, md5 = utils.md5, benchmark = utils.benchmark();

var config = utils.config(), xsreConfig = config.get('hzb').xsre;
var Request = require(libPath+'/broker/request');
var request = require('./request');

var con = require(libPath + '/sql');
var parseString = require('xml2js').parseString;
var xSre = require(libPath+'/xsre');
var async = require('async');
var districtFile = rootPath + '/test/data/districts';
var fs = require('fs');
var php = require('phpjs');
var filename = districtFile;
var prefixListStudent = '_xsre_list_students_';
var prefixListStudentDate = 'summary_student_list_date_';
var latestDateAvailable = {};
var organizationWhere = {};

//organizationWhere = {
//    _id: mongoose.Types.ObjectId('55913fc817aac10c2bbfe1e7')
//};

//console.log('WHERE: ', organizationWhere);
function cacheDebug(done){
    var key = prefixListStudent + '*';
    cache.get(key, function(err, data){
        benchmark.info(key, ' >>>>>>>>>>>>>>> DATA >>>>>>>>>>>>>>', data);
        done();
    });
}
/**
 *
 * @param done
 */
function activateUser(done){
    User.find({/*email: 'demo@upwardstech.com'*/}, function(err, users){
        if(err){
            return done(err);
        }

        async.eachSeries(users, function(user, cb){
            var allpermission = [];

            for(var i = 0; i < user.permissions.length; i++){
                user.permissions[i].activate = true;
                user.permissions[i].activateStatus = 'Active';
                user.permissions[i].activateDate = new Date();
                allpermission.push(user.permissions[i]);
            }
            //console.log(allpermission);
            if(allpermission.length === 0) {
                return cb(null, user);
            }

            var updated = {
                //$unset: { pending:"" },
                $set: {
                    permissions: allpermission,
                    last_updated: new Date()
                }
            };
            User.where({_id: user._id}).update(updated, function(err){
                console.log(err);
                cb(null);
            });
        }, done);
    });
}
/**
 *
 * @param callback
 */
function collectDataStudents(callback) {
    var collections = [];

    /**
     *
     * @param organization
     * @param done
     */
    function processStudent(organization, done) {

        Student.find({organization: organization._id}, function (err, students) {

            if (err) {
                return done(err);
            }

            if (!students) {
                return done('Data students not found');
            }

            console.log('STUDENT DATA OF ORG (' + organization.name + '): ' + students.length);

            async.eachSeries(students, function (student, cb) {
                var CBOStudent = {
                    '@': {
                        id: student._id.toString()
                    },
                    organization: {
                        '@': {
                            refId: student.organization.toString()
                        },
                        organizationName: organization.name,
                        externalServiceId: organization.externalServiceId,
                        personnelId: organization.personnelId,
                        authorizedEntityId: organization.authorizedEntityId,
                        districtStudentId: student.district_student_id,
                        zoneId: student.school_district,
                        contextId: xsreConfig.contextId
                    },

                    studentActivity: [],

                    programs: {
                        activities: {
                            activity: []
                        }
                    }

                };

                var programsId = {};

                var programId = [];

                _.each(student.programs, function (program) {

                    if (Object.keys(programsId).indexOf(program.program.toString()) === -1) {
                        programsId[program.program.toString()] = [];
                    }

                    programsId[program.program.toString()].push(program.toObject());

                    programId.push(program.program);

                    CBOStudent.programs.activities.activity.push({
                        studentActivityRefId: program.program.toString(),
                        startDate: moment(new Date(program.participation_start_date)).format('MM/DD/YYYY'),
                        endDate: moment(new Date(program.participation_end_date)).format('MM/DD/YYYY'),
                        active: program.active,
                        tags: {
                            tag: program.cohort
                        }

                    });

                });

                if (!_.isEmpty(programsId)) {

                    Program.find({_id: {$in: programId}}, function (err, programs) {

                        if (err) {
                            return cb(err);
                        }

                        _.each(programs, function (program) {

                            if (program._id.toString() in programsId) {

                                programsId[program._id.toString()].forEach(function (prgm) {

                                    CBOStudent.studentActivity.push({
                                        '@': {
                                            refId: program._id.toString()
                                        },
                                        title: program.name
                                    });

                                });

                            }

                        });

                        collections.push(CBOStudent);

                        cb();

                    });

                } else {

                    collections.push(CBOStudent);

                    cb();

                }

            }, done);

        });
    }

    Organization.find(organizationWhere, function (err, organizations) {

        if (err) {
            throw new Error(err);
        }

        if (!organizations) {
            throw new Error('Data organizations not found');
        }


        async.eachSeries(organizations, processStudent, function (err) {
            log('PUSH STUDENTS TO CEDARLABS: ' + collections.length);
            callback(xmlParser('CBOStudents', {CBOStudent: collections}, {
                declaration: {
                    encoding: 'utf-8'
                }
            }), collections.length);

        });

    });
}
/**
 * [collectCacheStudents description]
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
function collectCacheStudents(done) {

    benchmark.info('CACHE-STUDENT: START');
    Organization.find(organizationWhere, function (err, organizations) {

        if (err) {
            return benchmark.info(err);
        }

        var exit = false;
        var i = 0;
        benchmark.info("CACHE-STUDENT\tORG FOUND: " + organizations.length);
        _.each(organizations, function (organization) {

            if(++i >= organizations.length){
                exit = true;
            }

            Student.find({
                organization: organization._id
            }, function (err, students) {

                benchmark.info('CACHE-STUDENT: GET STUDENT LIST COUNT => ' + students.length);
                async.each(students, function (student, callback) {

                    var orgId = organization._id;

                    var studentId = student._id;

                    if (err) {
                        benchmark.info(err);
                        return callback(err);
                    }
                    /**
                     * If student is empty from database
                     */
                    if (!student) {
                        return benchmark.info('The student not found in database');
                    }

                    var brokerRequest = new Request({
                        externalServiceId: organization.externalServiceId,
                        personnelId: organization.personnelId,
                        authorizedEntityId: organization.authorizedEntityId
                    });
                    /**
                     * Request can handle store into cache, so we use force to store or update the data
                     */
                    brokerRequest.createXsre(student.district_student_id, student.school_district, function (error, response, body) {

                        if (error) {
                            benchmark.info(error);
                            return callback(error);
                        }

                        if (!body) {
                            benchmark.info('Data not found in database xsre');
                            return callback('Data not found in database xsre');

                        }

                        callback(null, body);

                    }, true);

                }, function () {
                    done();
                });
            });
        });

    });
}
/**
 *
 * @param force
 * @param done
 */
function collectCacheListStudentsAsync(force, done) {
    var studentNumber = 0;
    benchmark.info("CACHE-LIST-STUDENT\tSTART");
    Organization.find(organizationWhere, function (err, organizations) {

        if (err) {
            return benchmark.info(err);
        }
        var prefix = "";
        benchmark.info("CACHE-LIST-STUDENT\tORG FOUND: " + organizations.length);

        /**
         *
         * @param organization
         * @param callback
         */
        var map = function(organization, callback){
            var orgId = organization._id;
            var orgIdString = orgId.toString();
            benchmark.info('ORGID: ' + orgId);
            prefix = "CACHE-LIST-STUDENT";
            var brokerRequest = new Request({
                externalServiceId: organization.externalServiceId,
                personnelId: organization.personnelId,
                authorizedEntityId: organization.authorizedEntityId
            });

            /**
             *
             * @param student
             * @param cb
             */
            var mapStudent = function(student, cb){

                if(!(orgIdString in latestDateAvailable)){
                    latestDateAvailable[orgIdString] = {};
                }

                if(Object.keys(latestDateAvailable[orgIdString]).indexOf(student.school_district) === -1){
                    latestDateAvailable[orgIdString][student.school_district] = 0;
                }

                var studentId = student._id.toString();

                var data = {};
                /**
                 * If student is empty from database
                 */
                if (!student) {
                    benchmark.info('The student not found in database');
                    return cb(null, data);
                }

                brokerRequest.createXsre(student.district_student_id, student.school_district, function (error, response, body) {

                    if (error) {
                        benchmark.info(error);
                        return cb(error, data);
                    }

                    if (!body) {
                        benchmark.info(error);
                        return cb('Body was empty reponse', data);

                    }

                    if (response && response.statusCode === 200) {

                        utils.xml2js(body, function (err, result) {

                            if (err) {
                                benchmark.info(err);
                                log(err, 'error');
                                return cb(err, data);
                            }
                            var msg;

                            if(result && 'error' in result){

                                msg = result.error.message ? result.error.message : result.error;
                                console.log('X1:', result);
                                if(!msg){
                                    msg = 'Data not found!';
                                }
                                benchmark.info('XSRE - ERROR BODY: ' + msg);
                                return cb(msg, data);

                            }

                            if(result && 'Error' in result){

                                msg = result.Error.Message ? result.Error.Message : result.Error;
                                if(!msg){
                                    msg = 'Data not found!';
                                }
                                benchmark.info('XSRE - ERROR BODY: ' + msg);
                                log('XSRE - ERROR BODY RESULT: ' + msg, 'error');
                                return cb(msg, data);

                            }

                            benchmark.info('XSRE - CREATE AND MANIPULATE XSRE OBJECT');

                            data = new xSre(result).getStudentSummary();
                            //if(student.school_district === 'tukwila'){
                            //    console.log('ASSSS', JSON.stringify(data), latestDateAvailable[orgIdString][student.school_district] < data.latestDateTime, latestDateAvailable[orgIdString][student.school_district]);
                            //}
                            /**
                             * Check the data max
                             * @type {string}
                             */
                            if(data.latestDateTime){

                                if(latestDateAvailable[orgIdString][student.school_district] < data.latestDateTime){

                                    latestDateAvailable[orgIdString][student.school_district] = data.latestDateTime;

                                }

                            }

                            var key = prefixListStudent + organization._id + '_' + student._id;

                            cache.set(key, data, {ttl: 86400}, function () {
                                benchmark.info('Cache student from org: ', organization.name, ' Student ID: ' + student._id.toString());
                                cb(null, data);
                            });

                        });

                    } else {
                        cb(null, data);
                    }
                }, force);

            };

            
            Student.find({
                organization: organization._id
            }, function (err, students) {

                if(err){
                    benchmark.warn(err);
                    return callback(null, organization);
                }

                studentNumber += students.length;

                var orgIdString = organization._id.toString();

                benchmark.info(prefix + "\tBEFORE-STUDENTS: " + students.length + "\tORGID: " + organization._id + "\tORG: " + organization.name);

                async.eachLimit(students, 10, mapStudent, function(err){
                    if(err){
                        benchmark.info('ERROR: ', err);
                        log(err, 'error');
                    }

                    var latestDateMap = [];
                    // console.log(latestDateAvailable);
                    for(var l in latestDateAvailable[orgIdString]){
                        if(latestDateAvailable[orgIdString][l] === 0){
                            latestDateMap.push({
                                schoolDistrict: l,
                                latestDateTime: "",
                                latestDate: ""
                            });
                        } else{
                            var mm = moment(latestDateAvailable[orgIdString][l]);
                            latestDateMap.push({
                                schoolDistrict: l,
                                latestDateTime: latestDateAvailable[orgIdString][l] || "",
                                latestDate: mm.isValid() ? mm.format('MM/DD/YYYY') : ""
                            });
                        }
                    }
                    cache.set(prefixListStudentDate+organization._id, latestDateMap, {ttl: 86400}, function () {
                        benchmark.info('Cache student summary date from org: ', organization.name);
                        benchmark.info('Cache student from org: ', organization.name , ' Done!!');
                        // latestDateAvailable = {}; //reset it back
                        callback(null, organization);
                    });

                });

            });
        };

        async.each(organizations, map, function (err, data) {
            if(err){
                benchmark.info(err);
                log(err, 'error');
            }

            benchmark.info(
                '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> DONE'
            );

            done(err, data, studentNumber);
        });

    });
}

/**
 *
 * @param ok
 */
function pullStudentAsyncWithoutOrg(ok){
    var masterTable = '`students`';
    var backupTable = '`students__`';
    var t1 = '`student_programs`';
    var t2 = '`student_programs__`';
    var studentNumber = 0;
    /**
     *
     * @param err1
     */
    var okDone = function(err1){
        var ee = null;
        if(err1){
            ee = "\nError Progress: ";
            if(err1 instanceof Error){

                ee += err1.stack.split("\n");

            } else{

                ee += err1 + "";

            }
        }

        con.end(function(err2){
            if(err2) {
                if(ee === null){
                    ee = "";
                }
                ee += "\nError Disconnect: ";
                if(err2 instanceof Error){

                    ee += err2.stack.split("\n");

                } else {

                    ee += err2 + "";

                }
            }
            ok(php.nl2br(ee), studentNumber);
        });
    };

    con.query('drop table if exists ' + backupTable, function(err){
        if(err){
            return okDone(err);
        }
        con.query('drop table if exists ' + t2, function(err){
            if(err){
                return okDone(err);
            }
            con.query('create table ' + backupTable + ' like ' + masterTable, function(err, results){
                if(err){
                    return okDone(err);
                }
                con.query('create table ' + t2 + ' like ' + t1, function(err, results){
                    if(err){
                        return okDone(err);
                    }
                    /**
                     *
                     * @param studentData
                     * @param cb
                     */
                    function storeDataStudent(studentData, cb){
                        con.query('INSERT INTO ' + backupTable + ' SET ?', studentData, function(err, result){
                            if(err && err.errno !== 1062){
                                cb(err, result);
                            } else{
                                cb(null, result);
                            }
                        });
                    }

                    function storeDataStudentProgram(studentProgramData, cb){
                        con.query('INSERT INTO ' + t2 + ' SET ?', studentProgramData, function(err, result1){
                            if(err && err.errno !== 1062){
                                cb(err, result1);
                            } else{
                                cb(null, result1);
                            }
                        });
                    }

                    /**
                     *
                     * @param callback
                     */
                    function pullMap(callback){
                        new request().getBulkWithoutNavigationPage(storeDataStudent, storeDataStudentProgram, function(totalStudent, totalStudentProgram){
                            studentNumber = totalStudent;
                            callback();
                        }, 2);
                    }


                    var sql = 'TRUNCATE TABLE ' + backupTable;
                    con.query(sql, function(err, results){
                        if(err){
                            return okDone(err);
                        }
                        pullMap(function(err, students){

                            if(err){
                                benchmark.info(err);
                                return okDone(err);
                            }
                            benchmark.info(
                                '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> DONE'
                            );
                            var sql = 'DROP TABLE ' + masterTable;
                            con.query(sql, function(err, results){
                                if(err){
                                    //log(sql + ' WITH ERR: ' + err, 'error');
                                    return okDone(err, studentNumber);
                                }
                                sql = 'RENAME TABLE ' + backupTable + ' TO ' + masterTable;
                                con.query(sql, function(err, results){
                                    if(err){
                                        //log(sql + 'WITH ERR: ' + err, 'error');
                                        return okDone(err, studentNumber);
                                    }
                                    var sql = 'DROP TABLE ' + t1;
                                    con.query(sql, function(err, results){
                                        if(err){
                                            //log(sql + 'WITH ERR: ' + err, 'error');
                                            return okDone(err, studentNumber);
                                        }
                                        sql = 'RENAME TABLE ' + t2 + ' TO ' + t1;
                                        con.query(sql, function(err, results){
                                            return okDone(err, studentNumber);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

module.exports = {
    collect: collectDataStudents,
    cache: collectCacheStudents,
    cacheList: collectCacheListStudentsAsync,
    cacheDebug: cacheDebug,
    //dumpDataDistrictId: dumpDataDistrictId,
    //pullStudentAsync: pullStudentAsync
    pullStudentAsync: pullStudentAsyncWithoutOrg,
    activateUser: activateUser
};
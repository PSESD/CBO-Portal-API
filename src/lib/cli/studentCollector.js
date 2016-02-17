'use strict';
/**
 * Created by zaenal on 22/09/15.
 */
var mongoose = require('mongoose');
var rootPath = __dirname + '/../../';
var appPath = rootPath + 'app';
var libPath = rootPath + 'lib';
require('./db');
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
var config = require('config'), xsreConfig = config.get('hzb').xsre;

var Request = require(libPath+'/broker/request');
var request = require('./request');
var con = require('./mysql');
var parseString = require('xml2js').parseString;
var utils = require(libPath+'/utils'), cache = utils.cache(), log = utils.log, md5 = utils.md5, benchmark = utils.benchmark();
var xSre = require(libPath+'/xsre');
var async = require('async');
var districtFile = rootPath + '/test/data/districts';
var fs = require('fs');
var filename = districtFile;
var prefixListStudent = '_xsre_list_students_';
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
            }));

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

                var studentId = student._id.toString();

                var data = {};

                data[studentId] = null;
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
                        return cb(null, data);
                    }

                    if (!body) {
                        benchmark.info(error);
                        return cb(null, data);

                    }

                    if (response && response.statusCode === 200) {

                        utils.xml2js(body, function (err, result) {

                            if (err) {
                                benchmark.info(err);
                                log(err, 'error');
                                return cb(null, data);
                            }
                            var msg;

                            if(result && 'error' in result){

                                msg = result.error.message ? result.error.message : result.error;
                                console.log('X1:', result);
                                if(!msg){
                                    msg = 'Data not found!';
                                }
                                benchmark.info('XSRE - ERROR BODY: ' + msg);
                                return cb(null, data);

                            }

                            if(result && 'Error' in result){

                                msg = result.Error.Message ? result.Error.Message : result.Error;
                                if(!msg){
                                    msg = 'Data not found!';
                                }
                                benchmark.info('XSRE - ERROR BODY: ' + msg);
                                log('XSRE - ERROR BODY RESULT: ' + msg, 'error');
                                return cb(null, data);

                            }

                            benchmark.info('XSRE - CREATE AND MANIPULATE XSRE OBJECT');

                            data[studentId] = new xSre(result).getStudentSummary();

                            cb(null, data);

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

                benchmark.info(prefix + "\tBEFORE-STUDENTS: " + students.length + "\tORGID: " + organization._id + "\tORG: " + organization.name);

                var key = prefixListStudent + organization._id;

                var studentAsync = [];

                students.forEach(function(student){
                    studentAsync.push(function(pop){
                        mapStudent(student, pop);
                    });
                });

                async.series(studentAsync, function(err, stds){
                    if(err){
                        benchmark.info('ERROR: ', err);
                        log(err, 'error');
                    }
                    if(!stds){
                        benchmark.info(
                            'FAILED POPULATE THE DATA'
                        );
                        log('FAILED TO POPULATE DATA', 'error');
                    }
                    benchmark.info('Store student into the cache: ', stds.length);
                    /**
                     * Filter stds
                     */
                    var datas = {};
                    stds.forEach(function(std){
                        for(var sk in std){
                            datas[sk] = std[sk];
                        }
                    });

                    benchmark.info('Store student into the cache after filter: ', Object.keys(datas).length);
                    cache.set(key, datas, {ttl: 86400}, function () {
                        benchmark.info('Cache student from org: ', organization.name);
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
            done(err, data);
        });

    });
}
/**
 *
 * @param ok
 */
/*function pullStudentAsync(ok){
    var masterTable = '`students`';
    var backupTable = '`students__`';
    var t1 = '`student_programs`';
    var t2 = '`student_programs__`';

    con.query('create table ' + backupTable + ' like ' + masterTable, function(err, results){
        con.query('create table ' + t2 + ' like ' + t1, function(err, results){
            *//**
             *
             * @param organization
             * @param callback
             *//*
            function pullMap(organization, callback){

                new request().getBulk(function(studentList, studentProgramList){
                    //console.log(studentList);
                    if(studentList){
                        async.eachSeries(studentList, function(student, cb){
                            con.query('INSERT INTO ' + backupTable + ' SET ?', student, function(err, result){
                                if(err && err.errno !== 1062){
                                    console.log('INSERT ' + backupTable + ' ERROR: ', err);
                                }
                                cb(null, result);

                            });
                        }, function(err, data){
                            if(studentProgramList.length > 0){
                                async.eachSeries(studentProgramList, function(stdp, cb1){
                                    con.query('INSERT INTO ' + t2 + ' SET ?', stdp, function(err, result1){
                                        if(err && err.errno !== 1062){
                                            console.log('INSERT ' + t2 + ' ERROR: ', err);
                                        }
                                        cb1(null, result1);
                                    });
                                }, function(err, data){
                                    callback(null, organization);
                                });
                            } else {
                                callback(null, organization);
                            }

                        });
                    } else{
                        callback(null, organization);
                    }

                    //}, 2, "(organization/organizationName='" + organization.name + "')&sort=organization/districtStudentId:asc");
                    }, 2, "(organization/organizationName='" + organization.name + "')");
                //}, 2, "(organization/districtStudentId='10651041')");
            }


            Organization.find(organizationWhere, function(err, organizations){
                var sql = 'TRUNCATE TABLE ' + backupTable;
                con.query(sql, function(err, results){
                    async.eachSeries(organizations, pullMap, function(err, data){
                        if(err){
                            benchmark.info(err);
                        }

                        benchmark.info(
                            '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> DONE'
                        );
                        var sql = 'DROP TABLE ' + masterTable;
                        con.query(sql, function(err, results){
                            if(err){
                                console.log(err);
                            }
                            sql = 'RENAME TABLE ' + backupTable + ' TO ' + masterTable;
                            con.query(sql, function(err, results){
                                if(err){
                                    console.log(err);
                                }
                                var sql = 'DROP TABLE ' + t1;
                                con.query(sql, function(err, results){
                                    if(err){
                                        console.log(err);
                                    }
                                    sql = 'RENAME TABLE ' + t2 + ' TO ' + t1;
                                    con.query(sql, function(err, results){
                                        if(err){
                                            console.log(err);
                                        }
                                        con.end(function(err){
                                            ok();
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
}*/
/**
 *
 * @param ok
 */
function pullStudentAsyncWithoutOrg(ok){
    var masterTable = '`students`';
    var backupTable = '`students__`';
    var t1 = '`student_programs`';
    var t2 = '`student_programs__`';

    con.query('create table ' + backupTable + ' like ' + masterTable, function(err, results){
        con.query('create table ' + t2 + ' like ' + t1, function(err, results){
            /**
             *
             * @param callback
             */
            function pullMap(callback){
                new request().getBulkWithoutNavigationPage(function(studentList, studentProgramList){
                    console.log('TOTAL STUDENTS FROM CEDAREXPERT: ' + studentList.length);
                    console.log('TOTAL STUDENT PROGRAMS FROM CEDAREXPERT: ' + studentProgramList.length);
                    if(studentList){
                        async.eachSeries(studentList, function(student, cb){
                            con.query('INSERT INTO ' + backupTable + ' SET ?', student, function(err, result){
                                if(err && err.errno !== 1062){
                                    log('INSERT ' + backupTable + ' ERROR: ' + err, 'error');
                                }
                                cb(null, result);

                            });
                        }, function(err, data){
                            if(studentProgramList.length > 0){
                                async.eachSeries(studentProgramList, function(stdp, cb1){
                                    con.query('INSERT INTO ' + t2 + ' SET ?', stdp, function(err, result1){
                                        if(err && err.errno !== 1062){
                                            log('INSERT ' + t2 + ' ERROR: ' + err, 'error');
                                        }
                                        cb1(null, result1);
                                    });
                                }, function(err, data){
                                    callback(null, studentList);
                                });
                            } else {
                                callback(null, studentList);
                            }

                        });
                    } else{
                        callback(null, studentList);
                    }

                }, 2);
            }


            var sql = 'TRUNCATE TABLE ' + backupTable;
            con.query(sql, function(err, results){
                pullMap(function(err, students){
                    if(err){
                        benchmark.info(err);
                    }
                    benchmark.info(
                        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> DONE'
                    );
                    var sql = 'DROP TABLE ' + masterTable;
                    con.query(sql, function(err, results){
                        if(err){
                            log(sql + 'WITH ERR: ' + err, 'error');
                        }
                        sql = 'RENAME TABLE ' + backupTable + ' TO ' + masterTable;
                        con.query(sql, function(err, results){
                            if(err){
                                log(sql + 'WITH ERR: ' + err, 'error');
                            }
                            var sql = 'DROP TABLE ' + t1;
                            con.query(sql, function(err, results){
                                if(err){
                                    log(sql + 'WITH ERR: ' + err, 'error');
                                }
                                sql = 'RENAME TABLE ' + t2 + ' TO ' + t1;
                                con.query(sql, function(err, results){
                                    if(err){
                                        log(sql + 'WITH ERR: ' + err, 'error');
                                    }
                                    con.end(function(err){
                                        if(err) {
                                            log('DISCONECT WITH ERR: ' + err, 'error');
                                        }
                                        ok();
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
    pullStudentAsync: pullStudentAsyncWithoutOrg
};
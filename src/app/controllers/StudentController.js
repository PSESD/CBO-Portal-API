'use strict';
/**
 * Created by zaenal on 03/06/15.
 */
var mongoose = require('mongoose');
var Student = require('../models/Student');
var Program = require('../models/Program');
var User = require('../models/User');
var Organization = require('../models/Organization');
var BaseController = require('./BaseController');
var _ = require('underscore');
var __ = require('lodash');
var Request = require('../../lib/broker/request');
var utils = require('../../lib/utils'), cache = utils.cache(), log = utils.log, md5 = utils.md5, benchmark = utils.benchmark();
var ObjectId = mongoose.Types.ObjectId;
var StudentController = new BaseController(Student).crud();
var hal = require('hal');
var xSre = require('../../lib/xsre');
var async = require('async');
var prefixListStudent = '_xsre_list_students_';
/**
 * Get the list of all organizations that this user have access to in our system.
 * @param req
 * @param res
 * @returns {*}
 */
StudentController.getStudentsBackpack = function(req, res){

    var orgId = ObjectId(req.params.organizationId);

    var studentId = ObjectId(req.params.studentId);

    var separate = req.params.separate;

    var usePagination = false;

    if(!separate){

        separate = 'xsre';

    }

    if(separate !== 'general' && separate !== 'xsre'){

        usePagination = true;

    }

    benchmark.info('XSRE - START GET STUDENT BACKPACK => ' + separate);

    var showRaw = false;

    if('raw' in req.query && (parseInt(req.query.raw) > 0 || req.query.raw === 'true')){
        showRaw = true;
    }
    benchmark.info('XSRE - GET STUDENT');

    Student.protect(req.user.role, { students: studentId, value: studentId }, req.user).findOne({
        _id: studentId,
        organization: orgId
    }, function(err, student){

        if(err){
            return res.sendError(err);
        }
        /**
         * If student is empty from database
         */
        if(!student){
            return res.sendError('The student not found in database');
        }

        var key = md5([orgId.toString(), studentId.toString(), student.district_student_id, student.school_district, req.params.format, separate].join('_'));
        key = new Date().getTime();
        /**
         *
         * @param results
         * @param isFromCache
         */
        function embeds(results, isFromCache){

            res.header('X-Cached-Sre', isFromCache ? 1 : 0);

            benchmark.info('XSRE - EMBED RESULTS => ' + (isFromCache ? ' FROM CACHE' : ' FROM SERVER'));

            /**
             * Defined paging here
             */
            if(usePagination !== false){

                benchmark.info('XSRE - USING PAGINATION ON( ' + separate + ')');

                benchmark.info('XSRE - FINISH 3');

                if(results.raw){

                    delete results.raw;

                }
                /**
                 * Only for REPORT HERE START
                 * @type {{total: number, pageSize: number, pageCount: number, currentPage: number, data: Array, source: {}}}
                 */
                if(separate === 'report'){

                    var programsId = {};
                    var programId = [];

                    _.each(student.programs, function(program){

                        if(Object.keys(programsId).indexOf(program.program.toString()) === -1){
                            programsId[program.program.toString()] = [];
                        }

                        programsId[program.program.toString()].push(program.toObject());

                        programId.push(program.program);

                    });
                    if(programId.length > 0){

                        var reportCrit = { _id: { $in: programId } };

                        if(req.query.from && req.query.to){

                            reportCrit.participation_start_date = { $gte : new Date(req.query.from )};
                            reportCrit.participation_end_date = { $lte : new Date(req.query.to )};

                        }

                        console.log('REPORT CRIT: ', reportCrit);
                        Program.find(reportCrit).sort({ participation_end_date: -1 }).exec(function(err, programs){

                            if(err){
                                return res.sendError(err);
                            }

                            _.each(programs, function(program){

                                if(program._id.toString() in programsId){

                                    programsId[program._id.toString()].forEach(function(prgm){

                                        results.programs.push({
                                            name: program.name,
                                            from: prgm.participation_start_date,
                                            to: prgm.participation_end_date
                                        });

                                    });

                                }

                            });

                            benchmark.info('XSRE - FINISH 1');

                            return res.sendSuccess(null, new hal.Resource(results, req.originalUrl).toJSON());

                        });


                    } else{

                        benchmark.info('XSRE - FINISH 2');

                        return res.sendSuccess(null, new hal.Resource(results, req.originalUrl).toJSON());

                    }
                    return;
                }
                 /** END OF REPORT **/

                var paginate = {
                    total: 0,
                    pageSize: 10,
                    pageCount: 0,
                    currentPage: 1,
                    data: [],
                    source: {}
                };

                var arrayList = [];

                if(separate === 'transcript'){

                    paginate.source = _.clone(results);

                    delete paginate.source.details;

                    results = results.details;

                }

                if(separate === 'attendance'){

                    paginate.source.years = results.years;
                    paginate.source.legend = results.legend;

                    delete results.years;

                }

                paginate.total = results.length;

                if(typeof req.query.page !== 'undefined'){

                    paginate.currentPage = +req.query.page;

                }

                if(typeof req.query.pageSize !== 'undefined'){

                    if(req.query.pageSize === 'all'){

                        paginate.pageSize = paginate.total;

                    } else{

                        paginate.pageSize = +req.query.pageSize;

                    }
                }

                //split list into groups
                //console.log('PAGE: ', paginate);
                while(results.length > 0){
                    arrayList.push(results.splice(0, paginate.pageSize));
                }

                paginate.data = arrayList[+paginate.currentPage - 1];

                paginate.pageCount = Math.ceil(paginate.total / paginate.pageSize);

                var resource = new hal.Resource(paginate, req.originalUrl);

                if(paginate.currentPage + 1 <= paginate.pageCount){
                    var nextUrl = req.originalUrl;
                    if(nextUrl.indexOf('?') === -1){
                        nextUrl += '?';
                    } else{
                        nextUrl += '&';
                    }
                    resource.link(new hal.Link('nextUrl', nextUrl + 'page=' + (+paginate.currentPage + 1)));
                }

                return res.sendSuccess(null, resource.toJSON());

            }
            /**
             * Set personal
             */
            results.personal.collegeBound = _.isUndefined(student.college_bound) ? /*"N/A"*/"" : student.college_bound;
            results.personal.phone = _.isUndefined(student.phone) ? /*"N/A"*/"" : student.phone;
            results.personal.email = _.isUndefined(student.email) ? /*"N/A"*/"" : student.email;
            results.personal.firstName = _.isUndefined(student.first_name) ? /*"N/A"*/"" : student.first_name;
            results.personal.lastName = _.isUndefined(student.last_name) ? /*"N/A"*/"" : student.last_name;
            results.personal.middleName = _.isUndefined(student.middle_name) ? /*"N/A"*/"" : student.middle_name;
            results.personal.schoolDistrict = _.isUndefined(student.school_district) ? /*"N/A"*/"" : student.school_district;
            results.personal.address = _.isUndefined(student.address) ? /*"N/A"*/"" : student.address;

            results.personal.emergency1 = {
                name: _.isUndefined(student.emergency1_name) ? /*"N/A"*/"" : student.emergency1_name,
                relationship: _.isUndefined(student.emergency1_relationship) ? /*"N/A"*/"" : student.emergency1_relationship,
                email: _.isUndefined(student.emergency1_email) ? /*"N/A"*/"" : student.emergency1_email,
                phone: _.isUndefined(student.emergency1_phone) ? /*"N/A"*/"" : student.emergency1_phone,
                mentor: _.isUndefined(student.mentor1_name) ? /*"N/A"*/"" : student.mentor1_name
            };

            results.personal.emergency2 = {
                name: _.isUndefined(student.emergency2_name) ? /*"N/A"*/"" : student.emergency2_name,
                relationship: _.isUndefined(student.emergency2_relationship) ? /*"N/A"*/"" : student.emergency2_relationship,
                email: _.isUndefined(student.emergency2_email) ? /*"N/A"*/"" : student.emergency2_email,
                phone: _.isUndefined(student.emergency2_phone) ? /*"N/A"*/"" : student.emergency2_phone,
                mentor: _.isUndefined(student.mentor2_name) ? /*"N/A"*/"" : student.mentor2_name
            };

            if(showRaw){

                res.header('Content-Type', 'text/xml');

                return res.send(results.raw);

            }

            if(results.raw){
                delete results.raw;
            }

            res.xmlOptions = res.xmlKey = 'CBOStudentDetail';

            res.bigXml = true;

            var crit = {
                permissions: {
                    $elemMatch: {
                        organization: orgId,
                        students: studentId
                    }
                }
            };
            benchmark.info('XSRE - EMBED USER');
            User.find(crit, function(err, users){

                if(err){
                    return res.sendError(err);
                }

                if(!users){
                    users = [];
                }

                var resource = new hal.Resource(results, req.originalUrl);

                var embedsUsers = [];

                var embedsPrograms = [];

                _.each(users, function(user){

                    var fullname = [];

                    if(user.first_name){
                        fullname.push(user.first_name);
                    }
                    if(user.middle_name){
                        fullname.push(user.middle_name);
                    }
                    if(user.last_name){
                        fullname.push(user.last_name);
                    }

                    embedsUsers.push(new hal.Resource({
                        id: user._id.toString(),
                        email: user.email,
                        fullname: fullname.join(' ')
                    }, '/' + orgId + '/users/' + user._id));

                });

                var programsId = {};

                var programId = [];

                _.each(student.programs, function(program){

                    if(Object.keys(programsId).indexOf(program.program.toString()) === -1){
                        programsId[program.program.toString()] = [];
                    }

                    programsId[program.program.toString()].push(program.toObject());

                    programId.push(program.program);

                });

                if(!_.isEmpty(programsId)){
                    benchmark.info('XSRE - EMBED PROGRAM');
                    Program.find({ _id: { $in: programId } }).sort({ participation_end_date: -1}).exec(function(err, programs){

                        if(err){
                            return res.sendError(err);
                        }

                        _.each(programs, function(program){

                            if(program._id.toString() in programsId){

                                programsId[program._id.toString()].forEach(function(prgm){

                                    prgm.program_name = program.name;

                                    embedsPrograms.push(new hal.Resource(prgm));

                                });

                            }

                        });

                        resource.embed('users', embedsUsers);

                        resource.embed('programs', embedsPrograms);

                        benchmark.info('XSRE - FINISH 1');

                        res.sendSuccess(null, resource.toJSON());

                    });


                } else{

                    resource.embed('users', embedsUsers);

                    resource.embed('programs', embedsPrograms);

                    benchmark.info('XSRE - FINISH 2');

                    res.sendSuccess(null, resource.toJSON());

                }

            });
        }

        benchmark.info('XSRE - GET ORGANIZATION');

        Organization.findOne({ _id: orgId }, function(err, organization){

            if(err){
                return res.sendError(err);
            }
            /**
             * If organization is empty from database
             */
            if(!organization){
                return res.sendError('The organization not found in database');
            }

            var brokerRequest = new Request({
                externalServiceId: organization.externalServiceId,
                personnelId: organization.personnelId,
                authorizedEntityId: organization.authorizedEntityId
            });

            cache.get(key, function(err, result){

                if(err){
                    log(err);
                }

                if(!result){
                    benchmark.info('XSRE - REQUEST XSRE');
                    brokerRequest.createXsre(student.district_student_id, student.school_district, function(error, response, body){
                        benchmark.info('XSRE - GET RESPONSE');
                        if(error){
                            return res.sendError(error);
                        }

                        if(!body){

                            res.statusCode = response.statusCode || 404;

                            return res.sendError('Data not found in database xsre');

                        }

                        if(response && response.statusCode === 200){
                            benchmark.info('XSRE - PARSING DATA FROM XML TO JS');
                            utils.xml2js(body, function(err, result){

                                if(err){
                                    return res.sendError(err);
                                }
                                var msg;

                                if(result && 'error' in result){

                                    msg = result.error.message ? result.error.message : result.error;
                                    console.log('X1:', result);
                                    if(!msg){
                                        msg = 'Data not found!';
                                    }
                                    benchmark.info('XSRE - ERROR BODY: ' + msg);
                                    return res.sendError(msg);

                                }

                                if(result && 'Error' in result){

                                    msg = result.Error.Message ? result.Error.Message : result.Error;
                                    if(!msg){
                                        msg = 'Data not found!';
                                    }
                                    benchmark.info('XSRE - ERROR BODY: ' + msg);
                                    return res.sendError(msg);

                                }

                                benchmark.info('XSRE - CREATE AND MANIPULATE XSRE OBJECT');

                                var object = null;

                                var xsre = new xSre(result, body, separate, req.query).setLogger(benchmark);

                                if(usePagination === false){

                                    object = xsre.toObject();

                                } else {

                                    switch(separate){

                                        case 'attendance':
                                            var attendance = xsre.getAttendanceBehavior();
                                            object = attendance.getAttendances();
                                            object.years = attendance.getAvailableYears();
                                            object.legend = attendance.getLegend();
                                            break;
                                        case 'transcript':
                                            object = xsre.getTranscript().getTranscript();
                                            break;
                                        case 'assessment':
                                            object = xsre.getAssessment().getAssessment();
                                            break;
                                        case 'report':
                                            object = xsre.getReport().serialize();
                                            break;

                                    }

                                }

                                /**
                                 * Set to cache
                                 */
                                    //benchmark.info('XSRE - SET TO CACHE');
                                    //cache.set(key, object, function(err){
                                    //
                                    //    console.log(err);
                                    //    log(err);

                                embeds(object);

                                //});

                            });

                        } else{
                            benchmark.info('XSRE - PARSING DATA ERROR FROM XML TO JS');
                            utils.xml2js(body, function(err, result){
                                if(err){
                                    return res.sendError(err);
                                }
                                var msg;

                                if(result && 'error' in result){

                                    msg = result.error.message ? result.error.message : result.error;
                                    if(!msg){
                                        msg = 'Data not found!';
                                    }
                                    benchmark.info('XSRE - ERROR BODY: ' + msg);
                                    return res.sendError(msg);

                                }
                                if(result && 'Error' in result){

                                    msg = result.Error.Message ? result.Error.Message : result.Error;
                                    if(!msg){
                                        msg = 'Data not found!';
                                    }
                                    benchmark.info('XSRE - ERROR BODY: ' + msg);
                                    return res.sendError(msg);

                                }
                                console.log('X2:', result);
                                return res.sendError('Data not found!');

                            });
                        }
                    });

                } else{
                    console.log('FROM CACHE ---------------------------');
                    embeds(result, 1);

                }

            });

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
StudentController.deleteCacheStudentsBackpack = function(req, res){

    var orgId = ObjectId(req.params.organizationId);

    var studentId = ObjectId(req.params.studentId);

    var separate = req.query.separate || 'xsre';

    if(!separate){

        separate = 'xsre';

    }

    Student.protect(req.user.role, { students: studentId, value: studentId }, req.user).findOne({
        _id: studentId,
        organization: orgId
    }, function(err, student){

        if(err){
            return res.sendError(err);
        }
        /**
         * If student is empty from database
         */
        if(!student){
            return res.sendError('The student not found in database');
        }

        var key = md5([orgId.toString(), studentId.toString(), student.district_student_id, student.school_district, req.params.format, separate].join('_'));

        Organization.findOne({ _id: orgId }, function(err, organization){

            if(err){
                return res.sendError(err);
            }
            /**
             * If organization is empty from database
             */
            if(!organization){
                return res.sendError('The organization not found in database');
            }

            cache.del(key, function(err){

                if(err){

                    log(err, 'error');

                    return res.sendError('Delete cache error');

                }

                key = md5(['_xSre_', orgId.toString(), student._id.toString(), student.district_student_id, student.school_district].join('_'));

                cache.del(key, function(){

                    if(separate === 'xsre'){

                        key = new Request().clearCacheXsreKey(student.district_student_id, student.school_district, organization);

                        cache.del(key, function(){

                            res.sendSuccess('Delete cache successfully');

                        });

                    } else{

                        res.sendSuccess('Delete cache successfully');

                    }

                });

            });
        });

    });
};
/**
 *
 * @param brokerRequest
 * @param student
 * @param orgId
 * @param callback
 */
StudentController.getStudentDetail = function(brokerRequest, student, orgId, callback){

    var key = md5(['_xSre_', orgId.toString(), student._id.toString(), student.district_student_id, student.school_district].join('_'));

    cache.get(key, function(err, result){

        if(err){
            return callback(null, student, false);
        }

        if(!result){

            brokerRequest.createXsre(student.district_student_id, student.school_district, function(error, response, body){

                if(error){
                    return callback(null, student, false);
                }

                if(!body){

                    return callback(null, student, false);

                }

                if(response && response.statusCode === 200){

                    utils.xml2js(body, function(err, result){

                        if(err){
                            return callback(null, student, false);
                        }

                        var object = new xSre(result).getStudentSummary();

                        var newObject = student.toObject();

                        newObject.xsre = object;

                        /**
                         * Set to cache
                         */
                        cache.set(key, newObject, { ttl: 86400 }, function(){

                            callback(null, newObject, false);

                        });

                    });

                }
            });

        } else{


            callback(null, result, true);

        }

    });
};
/**
 *
 * @param brokerRequest
 * @param student
 * @param orgId
 * @param callback
 */
StudentController.refreshStudentSummary = function(brokerRequest, student, orgId, callback){

    var key = prefixListStudent + orgId + '_' + student._id.toString();

    brokerRequest.createXsre(student.district_student_id, student.school_district, function(error, response, body){

        if(error){
            return callback(error);
        }

        if(!body){
            return callback('Empty response');
        }
        //console.log('COUNT 3: ' + Object.keys(result).length);
        if(response && response.statusCode === 200){

            utils.xml2js(body, function(err, xmlResult){

                if(err){
                    return callback(err, null);
                }

                var updateObject = new xSre(xmlResult).getStudentSummary();

                cache.set(key, updateObject, {ttl: 86400}, callback);

            });

        } else{

            callback();
        }

    });

};
/**
 * Get all student in organization
 * @param req
 * @param res
 */
StudentController.getStudents = function(req, res){

    res.xmlKey = 'students';

    var orgId = ObjectId(req.params.organizationId);

    /**
     * Finding summary
     */
    if(req.query.summary){

        cache.get('summary_student_list_date_' + orgId, function(err, results){

            if(err){
                return res.sendError(err);
            }

            return res.sendSuccess(null, results);

        });
        return;
    }

    var crit = Student.crit(req.query, ['organization']);

    var withNoXsre = parseInt(req.query.noxsre) > 0;

    var withNoProgram = parseInt(req.query.noprogram) > 0;

    var userId = 'userId' in req.query ? req.query.userId : null;

    crit.organization = orgId;

    var filter = null;

    if(req.query.assign){

        filter = {

            onlyAssign: true

        };

    }

    var sorter = function(st){
        return [st.first_name, st.last_name];
    };


    Organization.findOne({ _id: orgId }, function(err, organization){

        if(err){
            return res.sendError(err);
        }
        /**
         * If organization is empty from database
         */
        if(!organization){
            return res.sendError('The organization not found in database');
        }

        Student.protect(req.user.role, filter, req.user).find(crit, function(err, students){

            if(err){
                return res.sendError(err);
            }

            if(userId !== null){

                User.findOne({
                    _id: ObjectId(userId),
                    permissions: {$elemMatch: {organization: ObjectId(req.params.organizationId)}}
                }, function (err, user) {

                    var stdlist = [];

                    if(!err && user){

                        user.getCurrentPermission(req.params.organizationId);

                        var obj = user.toJSON();

                        stdlist = _.map(obj.allStudentsByOrganization, function(v, k){
                            return v + '';
                        });

                    }
                    return res.sendSuccess(null, _.sortBy(_.map(students, function(val, key){
                        var o = val.toObject();
                        delete o.programs;
                        delete o.__v;
                        o.added = stdlist.indexOf(o._id + '') !== -1;
                        return o;
                    }), sorter));

                });
                return;

            }

            if(withNoProgram){
                return res.sendSuccess(null, _.sortBy(_.map(students, function(val, key){
                    var o = val.toObject();
                    delete o.programs;
                    delete o.__v;
                    return o;
                }), sorter));
            }

            if(withNoXsre){
                return res.sendSuccess(null, _.sortBy(students, sorter));
            }

            var key = prefixListStudent + orgId;

            async.map(students, function(student, callback){

                var newObject = student.toObject();

                newObject.xsre = {
                    "gradeLevel": /*"N/A"*/"",
                    "schoolYear": /*"N/A"*/"",
                    "schoolName": /*"N/A"*/"",
                    "attendanceCount": [],
                    "behaviorCount": [],
                    "riskFlag": [],
                    "onTrackToGraduate": /*"N/A"*/"",
                    "latestDate": ""
                };

                cache.get(key + '_' + student._id, function(err, std){

                    if(err){

                        return callback(null, newObject);

                    }

                    if(!_.isUndefined(std)){

                        newObject.xsre = std;

                    }

                    callback(null, newObject);

                });

            }, function(err, results){

                res.sendSuccess(null, _.sortBy(results, sorter));

            });

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
StudentController.getStudentNotAssigns = function(req, res){

    var orgId = ObjectId(req.params.organizationId);

    var where = { permissions: { $elemMatch: { organization: orgId } } };

    if(req.body.userId){

        where._id = ObjectId(req.body.userId);

    }

    var query = User.find(where);

    var crit = Student.crit(req.query, ['organization', '_id']);

    crit.organization = orgId;

    query.exec(function(err, users){

        var students = [];

        var showEmpty = true;

        users.forEach(function(user){

            user.permissions.forEach(function(permission){

                if(permission.organization.toString() === orgId.toString()){

                    //if (permission.role === 'case-worker-restricted') {

                    showEmpty = false;

                    permission.students.forEach(function(student){

                        if(students.indexOf(student) === -1){
                            students.push(student);
                        }

                    });

                    //}

                }

            });

        });

        if(showEmpty === true){

            return res.sendSuccess(null, []);

        }

        if(students.length > 0){
            crit._id = { $nin: students };
        }

        Student.find(crit, function(err, students){

            if(err){
                return res.sendError(err);
            }

            res.sendSuccess(null, students);

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
StudentController.createByOrgId = function(req, res){

    res.xmlKey = 'student';

    var orgId = ObjectId(req.params.organizationId);

    Organization.findOne({ _id: orgId }, function(err, organization){

        if(err){
            return res.sendError(err);
        }
        /**
         * If organization is empty from database
         */
        if(!organization){
            return res.sendError(res.__('data_not_found'));
        }

        var brokerRequest = new Request({
            externalServiceId: organization.externalServiceId,
            personnelId: organization.personnelId,
            authorizedEntityId: organization.authorizedEntityId
        });

        var obj = new Student(req.body);

        obj.organization = orgId;

        // set update time and update by user
        obj.created = new Date();

        obj.creator = req.user.userId;

        obj.last_updated = new Date();

        obj.last_updated_by = req.user.userId;

        User.findOne({ _id: req.user._id }, function(err, user){

            if(err){
                return res.sendError(err);
            }

            if(!user){
                return res.sendError(res.__('user_failed_to_update'));
            }

            obj.protect(req.user.role, null, req.user).save(function(err){

                if(err){

                    if(err.code && (err.code === 11000 || err.code === 11001)){

                        err = res.__('errors.duplicate_student', { districtId: req.body.district_student_id, district: req.body.school_district });

                    }

                    return res.sendError(err);
                }

                _.each(user.permissions, function(permission, key){

                    if(permission.organization.toString() === obj.organization.toString() && permission.students.indexOf(obj._id) === -1){

                        user.permissions[key].students.push(obj._id);

                    }

                });

                user.save(function(err){

                    if(err){
                        return res.sendError(err);
                    }

                    StudentController.refreshStudentSummary(brokerRequest, obj, orgId.toString(), function(){

                        res.sendSuccess(res.__('data_added'), obj);

                    });


                });

            });

        });

    });

};
/**
 * Get student organization by id
 * @param req
 * @param res
 */
StudentController.getStudentById = function(req, res){

    res.xmlOptions = 'student';

    var orgId = ObjectId(req.params.organizationId);

    var studentId = ObjectId(req.params.studentId);

    var crit = Student.crit(req.query, ['_id', 'organization']);

    var withXsre = parseInt(req.query.xsre) > 0;

    console.log('with XSRE: ', withXsre);

    crit.organization = orgId;

    crit._id = studentId;

    Organization.findOne({ _id: orgId }, function(err, organization){

        if(err){
            return res.sendError(err);
        }
        /**
         * If organization is empty from database
         */
        if(!organization){
            return res.sendError(res.__('record_not_found', 'Organization'));
        }

        var brokerRequest = new Request({
            externalServiceId: organization.externalServiceId,
            personnelId: organization.personnelId,
            authorizedEntityId: organization.authorizedEntityId
        });

        Student.protect(req.user.role, { students: studentId, value: studentId }, req.user).findOne(crit, function(err, student){

            if(err){
                return res.sendError(err);
            }
            /**
             * If student is empty from database
             */
            if(!student){
                return res.sendError(res.__('record_not_found', 'Student'));
            }

            if(withXsre){

                StudentController.getStudentDetail(brokerRequest, student, orgId, function(err, student, isCache){

                    res.header('X-Cached-Sre', isCache ? 1 : 0);

                    res.sendSuccess(student);

                });

            } else{

                res.sendSuccess(student);

            }

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
StudentController.deleteStudentById = function(req, res){

    var orgId = req.params.organizationId;

    var studentId = ObjectId(req.params.studentId);

    Student.protect(req.user.role, { students: studentId }, req.user).remove({
        organization: ObjectId(orgId),
        _id: ObjectId(req.params.studentId)
    }, function(err){

        if(err){
            return res.sendError(err);
        }

        User.findOne({ _id: req.user._id }, function(err, user){

            if(err){
                return res.sendError(err);
            }

            if(!user){
                return res.sendError(res.__('data_updated_failed'));
            }

            _.each(user.permissions, function(permission, key){

                var indexOf = permission.students.indexOf(ObjectId(req.params.studentId));

                if(permission.organization.toString() === orgId && indexOf !== -1){

                    delete user.permissions[key].students[indexOf];

                }

            });

            user.save(function(err){

                if(err){
                    return res.sendError(err);
                }

                cache.get(prefixListStudent + orgId + '_' + req.params.studentId, function(err, xsre){

                    if(err || !xsre){

                        return res.sendSuccess(res.__('data_deleted'));

                    }

                    if(studentId.toString() in xsre){

                        delete xsre[studentId.toString()];
                        /**
                         * Restore cache again
                         */
                        cache.set(prefixListStudent + orgId + '_' + req.params.studentId, xsre, { ttl: 86400 }, function(){

                            res.sendSuccess(res.__('data_deleted'));

                        });

                    } else{

                        res.sendSuccess(res.__('data_deleted'));

                    }

                });


            });

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
StudentController.putStudentById = function(req, res){

    res.xmlOptions = 'student';

    var studentId = ObjectId(req.params.studentId);

    var orgId = ObjectId(req.params.organizationId);

    Organization.findOne({ _id: orgId }, function(err, organization){

        if(err){
            return res.sendError(err);
        }
        /**
         * If organization is empty from database
         */
        if(!organization){
            return res.sendError(res.__('record_not_found', 'Organization'));
        }

        var brokerRequest = new Request({
            externalServiceId: organization.externalServiceId,
            personnelId: organization.personnelId,
            authorizedEntityId: organization.authorizedEntityId
        });

        Student.protect(req.user.role, { students: studentId }, req.user).findOne({
            _id: studentId,
            organization: orgId
        }, function(err, obj){

            if(err){
                return res.sendError(err);
            }

            if(!obj){
                return res.sendError(res.__('data_not_found'));
            }

            for(var prop in req.body){

                if(prop in obj){

                    obj[prop] = req.body[prop];

                }

            }
            // set update time and update by user
            obj.last_updated = new Date();

            obj.last_updated_by = req.user.userId;

            obj.protect(req.user.role, null, req.user).save(function(err){

                if(err){

                    if(err.code && (err.code === 11000 || err.code === 11001)){

                        err = res.__('errors.duplicate_student', { districtId: req.body.district_student_id, district: req.body.school_district });

                    }

                    return res.sendError(err);

                }

                StudentController.refreshStudentSummary(brokerRequest, obj, orgId.toString(), function(){

                    res.sendSuccess(res.__('data_updated'), obj);

                });

            });

        });
    });

};


/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = StudentController;

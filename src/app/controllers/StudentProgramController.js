'use strict';
/**
 * Created by zaenal on 21/05/15.
 */
var mongoose = require('mongoose');
var Student = require('../models/Student');
var StudentProgram = require('../models/StudentProgram');
var Organization = require('../models/Organization');
var Program = require('../models/Program');
var User = require('../models/User');
var Tag = require('../models/Tag');
var BaseController = require('./BaseController');
var _ = require('underscore');
var ObjectId = mongoose.Types.ObjectId;
var natural = require('natural'), tokenizer = new natural.WordTokenizer();

var moment = require('moment');
var utils = require('../../lib/utils');
var config = utils.config();


var StudentProgramController = new BaseController(StudentProgram).crud();


/**
 * Get all student programs by studentId in System
 * @param req
 * @param res
 * @returns {*}
 */
StudentProgramController.getByStudentId = function (req, res) {

    res.xmlKey = 'studentPrograms';

    var orgId = req.params.organizationId;

    var stdId = req.params.studentId;

    Student.protect(req.user.role, { students: stdId, value: stdId }, req.user).findOne({ _id: ObjectId(stdId), organization: ObjectId(orgId) }, function(err, student){

        if (err)  { return res.sendError(err); }

        if(!student) {
            return res.sendError(res.__('data_not_found'));
        }

        res.sendSuccess(null, student.programs);
    });

};
/**
 *
 * @param req
 * @param res
 */
StudentProgramController.getByStudentIdXsre = function(req, res){

    var orgId = req.params.organizationId;

    var stdId = req.params.studentId;

    Organization.pushStudent(req.user, orgId, stdId, function(err, data){

        if (err)  { return res.sendError(err); }

        res.set('Content-Type', 'text/xml');

        return res.send(data);

    });

};
/**
 *
 * @param req
 * @param res
 */
StudentProgramController.addByStudentId = function (req, res) {

    res.xmlOptions = 'student';

    var orgId = req.params.organizationId;

    var stdId = req.params.studentId;

    var studentProgram = {};

    if(req.body.programId) {
        studentProgram.program = ObjectId(req.body.programId);
    }

    if(req.body.cohort) {
        studentProgram.cohort = _.isArray(req.body.cohort) ? req.body.cohort : tokenizer.tokenize(req.body.cohort);
    }

    if(req.body.active) {
        studentProgram.active = (req.body.active === 'true');
    }

    if(req.body.participation_start_date) {
        studentProgram.participation_start_date = new Date(Date.parse(req.body.participation_start_date));
    }

    if(req.body.participation_end_date) {
        studentProgram.participation_end_date = new Date(Date.parse(req.body.participation_end_date));
    }

    studentProgram.created = new Date();

    studentProgram.creator = req.user.userId;

    studentProgram.last_updated = new Date();

    studentProgram.last_updated_by = req.user.userId;

    if(_.isEmpty(studentProgram)) {

        return res.sendError(res.__('parameter_required'));

    }

    Student.protect(req.user.role, { students: stdId, value: stdId }, req.user).findOne({ _id: ObjectId(stdId), organization: ObjectId(orgId) }, function(err, student){

        if (err)  { return res.sendError(err); }

        if(!student) {
            return res.sendError(res.__('data_not_found'));
        }

        student.programs.push(studentProgram);

        // set update time and update by user
        student.last_updated = new Date();

        student.last_updated_by = req.user.userId;

        student.save(function(err){

            if (err)  { return res.sendError(err); }

            Tag.addTag(ObjectId(orgId), studentProgram.cohort);

            res.sendSuccess(res.__('success_add_to', { name: 'Student', to: 'program'}), student);

        });

    });

};
/**
 * Get all list the students that is enrolled in this program.
 * @param req
 * @param res
 */
StudentProgramController.getByProgramId = function (req, res) {

    var orgId = req.params.organizationId;

    var proId = req.params.programId;

    Student.protect(req.user.role, { onlyAssign: true }, req.user).find({ organization: ObjectId(orgId), programs: { $elemMatch: { program: ObjectId(proId) } } }, function(err, students){

        if (err)  { return res.sendError(err); }

        if(!students) {
            return res.sendError(res.__('data_not_found'));
        }

        res.sendSuccess(null, students);

    });

};
/**
 * Add new student to program
 * @param req
 * @param res
 */
StudentProgramController.addByProgramId = function(req, res){

    var orgId = req.params.organizationId;

    var proId = req.params.programId;

    var stdId = req.body.studentId;

    var studentProgram = {};

    if(proId) {
        studentProgram.program = ObjectId(proId);
    }

    if(req.body.cohort) {
        studentProgram.cohort = _.isArray(req.body.cohort) ? req.body.cohort : tokenizer.tokenize(req.body.cohort);
    }

    if(req.body.active) {
        studentProgram.active = (req.body.active === 'true');
    }

    if(req.body.participation_start_date) {
        studentProgram.participation_start_date = new Date(Date.parse(req.body.participation_start_date));
    }

    if(req.body.participation_end_date) {
        studentProgram.participation_end_date = new Date(Date.parse(req.body.participation_end_date));
    }

    studentProgram.created = new Date();

    studentProgram.creator = req.user.userId;

    studentProgram.last_updated = new Date();

    studentProgram.last_updated_by = req.user.userId;

    if(!stdId || _.isEmpty(studentProgram)) {

        return res.sendError(res.__('parameter_required'));

    }

    Student.protect(req.user.role, { students: stdId, value: stdId }, req.user).findOne({ _id: ObjectId(stdId), organization: ObjectId(orgId) }, function(err, student){

        if (err)  { return res.sendError(err); }

        if(!student) {
            return res.sendError(res.__('data_not_found'));
        }

        student.programs.push(studentProgram);

        // set update time and update by user
        student.last_updated = new Date();

        student.last_updated_by = req.user.userId;

        student.save(function(err){

            if (err)  { return res.sendError(err); }

            Tag.addTag(ObjectId(orgId), studentProgram.cohort);

            res.sendSuccess(res.__('success_add_to', { name: 'Student', to: 'program'}), student);

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
StudentProgramController.getStudentById = function(req, res){

    var orgId = req.params.organizationId;

    var proId = req.params.programId;

    var stdId = req.params.studentId;

    var crit  = {
        organization: ObjectId(orgId),
        programs: { $elemMatch: { program: ObjectId(proId) } },
        _id: ObjectId(stdId)
    };

    Student.protect(req.user.role, { students: stdId, value: stdId }, req.user).findOne(crit, function (err, student) {

        if (err)  { return res.sendError(err); }
        /**
         * If student is empty from database
         */
        if (!student) {
            return res.sendError(res.__('record_not_found', 'Student'));
        }

        res.sendSuccess(student);

    });
};
/**
 *
 * @param req
 * @param res
 */
StudentProgramController.putStudentById = function(req, res){

    var orgId = req.params.organizationId;

    var proId = req.params.programId;

    var stdId = req.params.studentId;

    var crit  = {
        organization: ObjectId(orgId),
        programs: { $elemMatch: { program: ObjectId(proId) } },
        _id: ObjectId(stdId)
    };

    Student.protect(req.user.role, { students: stdId, value: stdId }, req.user).findOne(crit, function(err, student){

        if (err)  { return res.sendError(err); }

        if(!student) {
            return res.sendError(res.__('data_not_found'));
        }


        var programs = [];

        var studentProgram = {};

        for (var i = 0; i < student.programs.length; i++) {

            if (proId !== (student.programs[i].program + '')) {

                programs.push(student.programs[i]);

            } else {

                studentProgram = student.programs[i];

                if (proId) {
                    studentProgram.program = ObjectId(proId);
                }

                if (req.body.cohort) {
                    studentProgram.cohort = _.isArray(req.body.cohort) ? req.body.cohort : tokenizer.tokenize(req.body.cohort);
                }

                if (req.body.active) {
                    studentProgram.active = (req.body.active === 'true');
                }

                if (req.body.participation_start_date) {
                    studentProgram.participation_start_date = new Date(Date.parse(req.body.participation_start_date));
                }

                if (req.body.participation_end_date) {
                    studentProgram.participation_end_date = new Date(Date.parse(req.body.participation_end_date));
                }

                studentProgram.last_updated = new Date();

                studentProgram.last_updated_by = req.user.userId;

                programs.push(studentProgram);

            }
        }

        if (_.isEmpty(studentProgram)) {

            return res.sendError(res.__('parameter_required'));

        }

        Student.where({_id: student._id}).update({$set: { programs: programs}, last_updated: new Date(), last_updated_by: req.user.userId }, function (err, updated) {

            if (err)  { return res.sendError(err); }

            res.sendSuccess('Update success');

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
StudentProgramController.deleteStudentById = function(req, res){

    var orgId = req.params.organizationId;

    var proId = req.params.programId;

    var stdId = req.params.studentId;

    var crit  = {
        organization: ObjectId(orgId),
        programs: { $elemMatch: { program: ObjectId(proId) } },
        _id: ObjectId(stdId)
    };

    Student.protect(req.user.role, { students: stdId, value: stdId }, req.user).findOne(crit, function(err, student){

        if (err)  { return res.sendError(err); }

        if(!student) {
            return res.sendError(res.__('data_not_found'));
        }

        var programs = [];

        for (var i = 0; i < student.programs.length; i++) {

            if (proId !== (student.programs[i].program + '')) {

                programs.push(student.programs[i]);

            }
        }

        Student.where({_id: student._id}).update({$set: { programs: programs}, last_updated: new Date(), last_updated_by: req.user.userId }, function (err, updated) {

            if (err)  { return res.sendError(err); }

            res.sendSuccess(res.__('data_deleted'));

        });

    });

};

/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = StudentProgramController;
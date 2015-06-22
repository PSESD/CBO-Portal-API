/**
 * Created by zaenal on 03/06/15.
 */
var mongoose = require('mongoose');
var Student = require('../models/Student');
var Organization = require('../models/Organization');
var BaseController = require('./BaseController');
var _ = require('underscore');
var Request = require('../../lib/broker/Request');
var parseString = require('xml2js').parseString;

var ObjectId = mongoose.Types.ObjectId;


var StudentController = new BaseController(Student).crud();
/**
 * Get the list of all organizations that this user have access to in our system.
 * @param req
 * @param res
 * @returns {*}
 */
StudentController.getStudentsBackpack = function (req, res) {

    var cb = function() {
        var orgId = ObjectId(req.params.organizationId);

        var studentId = ObjectId(req.params.studentId);

        Student.findOne({_id: studentId, organization: orgId}, function (err, student) {

            if (err) return res.errJson(err);
            /**
             * If student is empty from database
             */
            if (!student) return res.errJson('The student not found in database');

            Organization.findOne({ _id: orgId }, function(err, organization){
                if (err) return res.errJson(err);
                /**
                 * If student is empty from database
                 */
                if (!student) return res.errJson('The student not found in database');

                var brokerRequest = new Request({ 
                    externalServiceId: organization.externalServiceId,  
                    personnelId: organization.personnelId,  
                    authorizedEntityId: organization.authorizedEntityId,  
                
                });

                var request = brokerRequest.createRequestProvider(student.district_student_id, student.school_district, function (error, response, body) {


                    if (error) {
                        return res.errJson(error);
                    }

                    if (!body) {
                        return res.errJson('Data not found');
                    }
                    if (response && response.statusCode == '200') {
                        parseString(body, function (err, result) {
                            var json = result.sre;
                            delete json['$'];
                            res.okJson(json);
                        });
                    } else {
                        parseString(body, function (err, result) {
                            var json = result ? result.Error : 'Error not response';
                            res.errJson(json);
                        });
                    }
                });
            });
            
        });
    };

    StudentController.grant(req, res, cb);
};
/**
 * Get all student in organization
 * @param req
 * @param res
 */
StudentController.getStudents = function (req, res) {

    var cb = function() {
        var orgId = ObjectId(req.params.organizationId);

        Student.find({organization: orgId}, function (err, students) {

            if (err) return res.errJson(err);

            res.okJson(null, students);
        });
    };

    StudentController.grant(req, res, cb);
};
/**
 *
 * @param req
 * @param res
 */
StudentController.createByOrgId = function (req, res) {

    var cb = function() {
        var obj = new Student(req.body);

        obj.organization = mongoose.Types.ObjectId(req.params.organizationId);

        // set update time and update by user
        obj.created = new Date();
        obj.creator = req.user.userId;
        obj.last_updated = new Date();
        obj.last_updated_by = req.user.userId;


        obj.save(function (err) {
            if (err) {
                return res.errJson(err);
            }

            res.okJson('Successfully Added', obj);
        });
    };

    StudentController.grant(req, res, cb);
};
/**
 * Get student organization by id
 * @param req
 * @param res
 */
StudentController.getStudentById = function (req, res) {

    var cb = function() {
        var orgId = req.params.organizationId;

        Student.findOne({organization: ObjectId(orgId), _id: ObjectId(req.params.studentId)}, function (err, student) {

            if (err) return res.errJson(err);
            /**
             * If student is empty from database
             */
            if (!student) return res.errJson('The student not found in database');

            res.okJson(student);
        });
    };

    StudentController.grant(req, res, cb);
};
/**
 *
 * @param req
 * @param res
 */
StudentController.deleteStudentById = function (req, res) {

    var cb = function() {
        var orgId = req.params.organizationId;

        Student.remove({organization: ObjectId(orgId), _id: ObjectId(req.params.studentId)}, function (err, student) {

            if (err) return res.errJson(err);

            res.okJson('Successfully deleted');
        });
    };

    StudentController.grant(req, res, cb);
};
/**
 *
 * @param req
 * @param res
 */
StudentController.putStudentById = function(req, res){

    var cb = function () {

        Student.findOne({_id: ObjectId(req.params.studentId), organization: ObjectId(req.params.organizationId)}, function (err, obj) {

            if (err)  return res.errJson(err);

            if (!obj) return res.errJson('Data not found');

            for (var prop in req.body) {

                if(prop in obj) {

                    obj[prop] = req.body[prop];

                }

            }
            // set update time and update by user
            obj.last_updated = new Date();
            obj.last_updated_by = req.user.userId;

            obj.save(function (err) {

                if (err) {

                    return res.errJson(err);
                }

                res.okJson('Successfully updated!', obj);

            });

        });

    };

    StudentController.grant(req, res, cb);
};
/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = StudentController;
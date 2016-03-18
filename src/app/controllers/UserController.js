'use strict';
/**
 * Created by zaenal on 21/05/15.
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var User = require('../models/User');
var Student = require('../models/Student');
var Client = require('../models/Client');
var Code = require('../models/Code');
var BaseController = require('./BaseController');
var util = require('util');
var extend = util._extend;
var _ = require('underscore');
var UserController = new BaseController(User).crud();

UserController.sorter = function(st){
    return [st.first_name, st.last_name];
};

/**
 * Get Current User Login
 * @param req
 * @param res
 */
UserController.get = function (req, res) {

    var crit = { _id: req.user._id };

    User.findOne(crit, function (err, obj) {

        if (err)  { return res.sendError(err); }

        res.sendSuccess(obj);

    });

};

/**
 * Delete by email
 * @param req
 * @param res
 */
UserController.deleteByEmail = function (req, res) {

    var model = User;

    var cb = function (userId, req) {

        model.remove({
            _id: userId
        }, function (err, obj) {

            if (err)  { return res.sendError(err); }

            Client.remove({userId: userId}, function (err) {

                if (err)  { return res.sendError(err); }

                Code.remove({userId: userId}, function (err) {

                    if (err)  { return res.sendError(err); }

                });

            });

            res.sendSuccess(res.__('data_deleted'));

        });

    };

    if(req.body.email === req.user.email) {
        return res.errUnauthorized();
    }

    User.findOne({email: req.body.email}, function (err, user) {

        if (err)  { return res.sendError(err); }

        if(!user) { return res.sendError(res.__('user_not_found')); }

        cb(user._id, req);

    });

};

/**
 *
 * @param req
 * @param res
 */
UserController.updateAccount = function (req, res) {

    var crit = { _id: req.user._id };

    //Set reset/change password disabled
    var canChangePassword = false;

    if(process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'){
        canChangePassword = true;
    }

    if(canChangePassword){
        if('password' in req.body){

            if('retype_password' in req.body && req.body.password !== req.body.retype_password){

                return res.sendError(res.__('password_not_match'));

            } else if(!req.body.password){

                delete req.body.password;

            }

        }
    } else{
        ['password', 'retype_password'].forEach(function(param){

            if(param in req.body){
                delete req.body[param];
            }

        });
    }


    User.findOne(crit, function (err, obj) {

        if (err)  { return res.sendError(err); }

        if(!obj) {
            return res.sendError('User not found');
        }

        ["first_name", "middle_name", "last_name", "password"].forEach(function(prop){

            if(prop in req.body) {
                obj[prop] = req.body[prop];
            }

        });
        // set update time and update by user
        obj.last_updated = new Date();

        obj.last_updated_by = req.user.userId;

        obj.save(function (err) {

            if (err)  { return res.sendError(err); }

            res.sendSuccess(res.__('data_updated'), obj);

        });

    });

};

/**
 *
 * @param req
 * @param res
 */
UserController.save = function (req, res) {

    var crit = {_id: req.user._id};

    //if(req.body.email && req.user.isAdmin()){
    //    crit = { email: req.body.email };
    //    delete req.body.email;
    //}

    var canChangePassword = false;

    if(process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'){
        canChangePassword = true;
    }

    if(canChangePassword){
        if('password' in req.body){

            if('retype_password' in req.body && req.body.password !== req.body.retype_password){

                return res.sendError(res.__('password_not_match'));

            } else if(!req.body.password){

                delete req.body.password;

            }

        }
    } else{
        ['password', 'retype_password'].forEach(function(param){

            if(param in req.body){
                delete req.body[param];
            }

        });
    }

    User.findOne(crit, function (err, obj) {

        if (err)  { return res.sendError(err); }

        if(!obj) {
            return res.sendError('User not found');
        }


        var role = req.body.role + '';


        /**
         * Filter if user downgrade here role
         */
        if(req.user._id.toString() === obj._id.toString() && req.user.isAdmin()){

            if(role.indexOf('case-worker') !== -1) {
                return res.sendError(res.__('admin_never_able_to_downgrade'));
            }

        }

        if('is_super_admin' in req.body && obj.isAdmin()) {
            delete req.body.is_super_admin;
        }


        ["first_name", "middle_name", "last_name", "password", "is_super_admin"].forEach(function(prop){

            if(prop in req.body) {
                obj[prop] = req.body[prop];
            }

        });

        if(!obj.isAdmin()){

            obj.saveWithRole(req.user, req.params.organizationId, function (err, user) {

                if (err)  { return res.sendError(err); }

                res.sendSuccess(res.__('data_updated'), user.toJSON());

            });

        } else {

            obj.saveWithRole(req.user, req.params.organizationId, role, function (err, user) {

                if (err)  { return res.sendError(err); }

                res.sendSuccess(res.__('data_updated'), user.toJSON());

            });
        }

    });

};
/**
 *
 * @param req
 * @param res
 */
UserController.cleanAll = function(req, res){

    var email = req.body.email || req.query.email;

    var emails = [ 'test@test.com', 'support@upwardstech.com' ];

    if(!email || emails.indexOf(email) === -1) {
        return res.sendError(res.__('parameter_required'));
    }

    User.findOne({ email: email }, function(err, user){

        if (err)  { return res.sendError(err); }

        User.removeDeep(user._id, function(err){ console.log(err);});

        res.sendSuccess(res.__('done'));

    });

};
/**
 * ----------------------- USER STUDENT ------------------------------------
 */
UserController.getByUserId = function(req, res){

    res.xmlKey = 'students';

    var currentUserId   = req.params.userId;

    var organizationId  = req.params.organizationId;

    var unassigned      = req.query.unassigned === 'true' || req.query.unassigned === 1;

    if(unassigned){

        var orgId = ObjectId(organizationId);

        var where = { permissions: { $elemMatch: { organization: orgId } }};

        if(currentUserId){

            where._id = ObjectId(currentUserId);

        }

        var query = User.find(where);

        var crit = Student.crit(req.query, ['organization', '_id']);

        crit.organization = orgId;

        query.exec(function(err, users){

            var students = [];

            var showEmpty = true;

            users.forEach(function(user){

                user.permissions.forEach(function(permission){

                    if(permission.organization.toString() === orgId.toString()) {

                        //if (permission.role === 'case-worker-restricted') {

                        showEmpty = false;

                        permission.students.forEach(function (student) {

                            if (students.indexOf(student) === -1) {
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

            if(students.length > 0) {
                crit._id = { $nin: students };
            }

            Student.find(crit, function (err, students) {

                if (err)  { return res.sendError(err); }

                res.sendSuccess(null, _.sortBy(students, UserController.sorter));

            });

        });

    } else {

        User.findOne({_id: ObjectId(currentUserId)}, function (err, currUser) {

            if (err)  { return res.sendError(err); }

            if (!currUser) {
                return res.sendError(res.__('user_not_found'));
            }

            currUser.getCurrentPermission(organizationId);

            Student.protect(currUser.role, {onlyAssign: true}, currUser).find({organization: ObjectId(organizationId)}, function (err, students) {

                if (err)  { return res.sendError(err); }

                res.sendSuccess(null, _.sortBy(students, UserController.sorter));

            });

        });
    }

};
/**
 *
 * @param req
 * @param res
 */
UserController.postByUserId = function(req, res){

    res.xmlOptions = 'student';

    var currentUserId   = req.params.userId;

    var organizationId  = req.params.organizationId;

    var user            = req.user;

    User.findOne({ _id: ObjectId(currentUserId) }, function(err, currUser){

        if (err)  { return res.sendError(err); }

        if(!currUser) {
            return res.sendError(res.__('user_not_found'));
        }

        var obj = new Student(req.body);

        obj.organization = ObjectId(organizationId);

        // set update time and update by user
        obj.created = new Date();

        obj.creator = req.user.userId;

        obj.last_updated = new Date();

        obj.last_updated_by = req.user.userId;

        obj.save(function (err) {

            if (err) { return res.sendError(err); }

            _.each(currUser.permissions, function(permission, key){

                if(permission.organization.toString() === obj.organization.toString() && permission.students.indexOf(obj._id) === -1){

                    currUser.permissions[key].students.push(obj._id);

                }

            });

            currUser.save(function(err){

                if (err) { return res.sendError(err); }

                res.sendSuccess(res.__('data_added'), obj);
            });

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
UserController.getStudentUserById = function(req, res){

    res.xmlKey = 'students';

    var currentUserId   = req.params.userId;

    var organizationId  = req.params.organizationId;

    var studentId       = req.params.studentId;

    User.findOne({ _id: ObjectId(currentUserId) }, function(err, currUser){

        if (err)  { return res.sendError(err); }

        if(!currUser) {
            return res.sendError(res.__('user_not_found'));
        }

        currUser.getCurrentPermission(organizationId);

        Student.protect(currUser.role, { students: ObjectId(studentId) }, currUser).findOne({ _id: studentId, organization: ObjectId(organizationId) }, function (err, students) {

            if (err)  { return res.sendError(err); }

            res.sendSuccess(null, _.sortBy(students, UserController.sorter));

        });

    });

};


/**
 *
 * @param req
 * @param res
 */
UserController.putStudentUserById = function(req, res){

    res.xmlOptions = 'student';

    var currentUserId   = req.params.userId;

    var organizationId  = req.params.organizationId;

    var studentId       = ObjectId(req.params.studentId);

    User.findOne({ _id: ObjectId(currentUserId) }, function(err, currUser){

        if (err)  { return res.sendError(err); }

        if(!currUser) {
            return res.sendError(res.__('user_not_found'));
        }

        Student.findOne({ _id: studentId, organization: ObjectId(organizationId) }, function (err, obj) {

            if (err) { return res.sendError(err); }

            if (!obj) {
                return res.sendError(res.__('data_not_found'));
            }

            for (var prop in req.body) {

                if(prop in obj) {

                    obj[prop] = req.body[prop];

                }

            }
            // set update time and update by user
            obj.last_updated = new Date();

            obj.last_updated_by = req.user.userId;

            obj.save(function (err) {

                if (err)  { return res.sendError(err); }

                _.each(currUser.permissions, function(permission, key){

                    if(permission.organization.toString() === obj.organization.toString() && permission.students.indexOf(obj._id) === -1){

                        currUser.permissions[key].students.push(obj._id);

                    }

                });

                currUser.save(function(err){

                    if (err) { return res.sendError(err); }

                    res.sendSuccess(res.__('data_updated'), obj);

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
UserController.deleteStudentUserById = function(req, res){

    var currentUserId   = req.params.userId;

    var organizationId  = req.params.organizationId;

    var user            = req.user;

    var studentId       = req.params.studentId;

    User.findOne({ _id: ObjectId(currentUserId) }, function(err, currUser){

        if (err)  { return res.sendError(err); }

        if(!currUser) {
            return res.sendError(res.__('user_not_found'));
        }

        Student.findOne({ _id: studentId, organization: ObjectId(organizationId) }, function (err, student) {

            if (err)  { return res.sendError(err); }

            if(!student) {
                return res.sendError(res.__('record_not_found', 'Student'));
            }

            var allpermission = [];

            for (var i = 0; i < currUser.permissions.length; i++) {

                if (student.organization.toString() === (currUser.permissions[i].organization + '')) {

                    var permissionStudents = [];

                    _.each(currUser.permissions[i].students, function(std, key){

                        if(std.toString() !== student._id.toString()){

                            permissionStudents.push(std);

                        }

                    });

                    currUser.permissions[i].students = permissionStudents;

                }

                allpermission.push(currUser.permissions[i]);

            }

            User.where({_id: currUser._id}).update({$set: {permissions: allpermission}, last_updated: new Date(), last_updated_by: req.user.userId }, function (err, updated) {

                if (err)  {
                    return res.sendError(err);
                }

                res.sendSuccess(res.__('data_deleted'));

            });

        });

    });

};
/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = UserController;
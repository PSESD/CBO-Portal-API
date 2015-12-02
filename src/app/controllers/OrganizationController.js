'use strict';
/**
 * Created by zaenal on 21/05/15.
 */
var mongoose = require('mongoose');
var Organization = require('../models/Organization');
var Program = require('../models/Program');
var User = require('../models/User');
var Access = require('../access/access').getInstance();
var BaseController = require('./BaseController');
var php = require('phpjs');
var _ = require('underscore');
var ObjectId = mongoose.Types.ObjectId;
var OrganizationController = new BaseController(Organization).crud('organizationId');
/**
 * Get the list of all organizations that this user have access to in our system.
 * @param req
 * @param res
 * @returns {*}
 */
OrganizationController.get = function (req, res) {

    Organization.find({ _id: req.organization._id }, function (err, orgs) {

        if (err)  { return res.sendError(err); }

        res.xmlKey = 'organizations';

        res.sendSuccess(null, orgs);

    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.find = function (req, res) {

    var crit = Organization.crit(req.query);

    crit._id = req.params.organizationId;

    Organization.findOne(crit, function (err, org) {

        if (err)  { return res.sendError(err); }

        res.sendSuccess(org);

    });

};
/**
 * General information and setup of an organization.
 * Get organization item
 * @param req
 * @param res
 */
OrganizationController.profile = function (req, res) {

    var crit = Organization.crit(req.query);

    crit._id = req.params.organizationId;


    Organization.findOne(crit, function (err, org) {

        if (err)  { return res.sendError(err); }

        res.xmlOptions = 'organization';

        res.sendSuccess(org);

    });

};
/**
 * General information and setup of an organization.
 * @param req
 * @param res
 */
OrganizationController.updateProfile = function(req, res){

    Organization.findOne({_id: ObjectId(req.params.organizationId)}, function (err, obj) {

        if (err) { return res.sendError(err); }

        if (!obj) return res.sendError('Data not found');

        for (var prop in req.body) {

            if (prop in obj) {

                obj[prop] = req.body[prop];

            }
        }
        // set update time and update by user
        obj.last_updated = new Date();

        obj.last_updated_by = req.user.userId;
        // save the movie
        obj.save(function (err) {

            if (err)  { return res.sendError(err); }

            res.xmlOptions = 'organization';

            res.sendSuccess('Successfully updated!', obj);

        });
    });

};
/**
 * Find all users by org id
 * @param req
 * @param res
 */
OrganizationController.allUsers = function (req, res) {


    User.find({permissions: {$elemMatch: {organization: ObjectId(req.params.organizationId)}}}, function (err, users) {

        if (err)  { return res.sendError(err); }

        var tmp = [];

        users.forEach(function(user){

            user.getCurrentPermission(req.params.organizationId);

            var obj = user.toJSON();

            if(obj._id.toString() !== req.user._id.toString()){

                delete obj.permissions;

            }

            tmp.push(obj);

        });

        res.xmlKey = 'users';

        res.sendSuccess(null, tmp);

    });


};

/**
 * Find organization by user id
 * @param req
 * @param res
 */
OrganizationController.getUser = function (req, res) {


    User.findOne({
        _id: ObjectId(req.params.userId),
        permissions: {$elemMatch: {organization: ObjectId(req.params.organizationId)}}
    }, function (err, user) {

        if (err)  { return res.sendError(err); }

        if(!user) return res.sendError('User not found!');

        user.getCurrentPermission(req.params.organizationId);

        var obj = user.toJSON();

        res.xmlOptions = 'user';

        res.sendSuccess(obj);

    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.postUser = function (req, res) {


    var orgId = req.params.organizationId;

    var userId = req.body.userId;

    var permissions = {};

    if (req.body.organization) permissions.organization = ObjectId(req.body.organization);

    permissions.students = req.body.students || [];

    permissions.role = req.body.role || 'case-worker';

    permissions.is_special_case_worker = req.body.is_special_case_worker || false;

    permissions.students = req.body.students || [];

    permissions.permissions = req.body.permissions || [];

    permissions.created = new Date();

    permissions.creator = req.user.userId;

    permissions.last_updated = new Date();

    permissions.last_updated_by = req.user.userId;

    if (_.isEmpty(permissions)) return res.sendError('POST parameter is empty!');

    User.findOne({_id: ObjectId(userId)}, function (err, user) {

        if (err)  { return res.sendError(err); }

        if (!user) return res.sendError('User data not found');

        var allpermission = [];

        for (var i = 0; i < user.permissions.length; i++) {

            if (permissions.organization !== (user.permissions[i].organization + '')) {

                allpermission.push(user.permissions[i]);

            } else {

                user.permissions[i].students = permissions.students;

                user.permissions[i].permissions = permissions.permissions;

                allpermission.push(user.permissions[i]);

            }
        }

        if(allpermission.length === 0) allpermission.push(permissions);



        User.where({_id: user._id}).update({$set: {permissions: allpermission}, last_updated: new Date(), last_updated_by: req.user.userId }, function (err, updated) {

            if (err)  { return res.sendError(err); }

            user.permissions = allpermission;

            user.getCurrentPermission(orgId);

            res.xmlOptions = 'user';

            res.sendSuccess('Organization successfully add to User', user);

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.putUser = function (req, res) {

    //if('password' in req.body){
    //
    //    if('retype_password' in req.body && req.body.password !== req.body.retype_password){
    //
    //        return res.sendError('Password didn\'t match');
    //
    //    } else if(!req.body.password){
    //
    //        delete req.body.password;
    //
    //    }
    //
    //}

    ['password', 'retype_password'].forEach(function(param){

        if(param in req.body) delete req.body[param];

    });

    res.xmlOptions = 'user';

    User.findOne({_id: ObjectId(req.params.userId)}, function (err, obj) {

        if (err) { return res.sendError(err); }

        if (!obj) return res.sendError('Data not found');


        // set update time and update by user
        obj.last_updated = new Date();

        obj.last_updated_by = req.user.userId;

        var role = null;

        ["first_name", "middle_name", "last_name", "password", "is_super_admin"].forEach(function(prop){

            if(prop in req.body) obj[prop] = req.body[prop];

        });

        if(req.body.role){

            role = req.body.role;
            /**
             * Filter if user downgrade here role
             */
            if(req.user._id.toString() === obj._id.toString() && req.user.isAdmin()){

                if(role.indexOf('case-worker') !== -1) return res.sendError("Admin never be able to downgrade itself to a case worker");

            }

            obj.saveWithRole(req.user, req.params.organizationId, role, function (err, user) {

                if (err)  { return res.sendError(err); }

                res.sendSuccess('Successfully updated!', user);

            });

        } else {

            obj.saveWithRole(req.user, req.params.organizationId, function (err, user) {

                if (err)  { return res.sendError(err); }

                res.sendSuccess('Successfully updated!', user);

            });

        }

    });

};

/**
 *
 * @param req
 * @param res
 */
OrganizationController.deleteUser = function (req, res) {

    User.findOne({_id: ObjectId(req.params.userId)}, function (err, user) {

        if (err)  { return res.sendError(err); }


        if (!user) return res.sendError("User not found");

        var allpermission = [];

        for (var i = 0; i < user.permissions.length; i++) {

            if (req.params.organizationId != (user.permissions[i].organization + '')) {

                allpermission.push(user.permissions[i]);

            }
        }

        User.where({_id: user._id}).update({$set: {permissions: allpermission}, last_updated: new Date(), last_updated_by: req.user.userId }, function (err, updated) {

            if (err)  { return res.sendError(err); }

            res.sendSuccess('Delete success');

        });
    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.allProgram = function (req, res) {

    res.xmlKey = 'programs';

    var crit = Program.crit(req.query, ['organization']);

    crit.organization = ObjectId(req.params.organizationId);

    Program.find(crit, function (err, objs) {

        if (err) { return res.sendError(err); }

        res.sendSuccess(null, objs);

    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.getProgram = function (req, res) {

    res.xmlOptions = 'program';

    var crit = Program.crit(req.query, ['_id', 'organization']);

    crit._id = ObjectId(req.params.programId);

    crit.organization = ObjectId(req.params.organizationId);

    Program.findOne(crit, function (err, obj) {

        if (err) { return res.sendError(err); }

        if (!obj) return res.sendError('Data not found');

        res.sendSuccess(obj);

    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.postProgram = function (req, res) {

    var orgId = ObjectId(req.params.organizationId);

    res.xmlOptions = 'program';

    Program.findOne({ name: req.body.name, organization: orgId }, function(err, obj){

        if (err)  { return res.sendError(err); }

        if(!obj){

            obj = new Program(req.body);

            // set update time and update by user
            obj.created = new Date();

            obj.creator = req.user.userId;

            obj.organization = orgId;

        } else {

            obj.last_updated = new Date();

            obj.last_updated_by = req.user.userId;

        }

        obj.save(function (err) {

            if (err)  { return res.sendError(err); }

            res.sendSuccess('Successfully Added', obj);

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.putProgram = function (req, res) {

    res.xmlKey = 'program';

    Program.findOne({_id: ObjectId(req.params.programId), organization: ObjectId(req.params.organizationId)}, function (err, obj) {

        if (err) { return res.sendError(err); }

        if (!obj) return res.sendError('Data not found');

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

            res.sendSuccess('Successfully updated!', obj);

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.deleteProgram = function (req, res) {

    Program.remove({
        _id: ObjectId(req.params.programId),
        organization: ObjectId(req.params.organizationId)
    }, function (err, obj) {

        if (err)  { return res.sendError(err); }

        res.sendSuccess('Successfully deleted');

    });

};
/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = OrganizationController;
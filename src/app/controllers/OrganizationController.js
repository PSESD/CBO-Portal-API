'use strict';
/**
 * Created by zaenal on 21/05/15.
 */
var mongoose = require('mongoose');
var Organization = require('../models/Organization');
var Program = require('../models/Program');
var Student = require('../models/Student');
var User = require('../models/User');
var Access = require('../access/access').getInstance();
var BaseController = require('./BaseController');
var php = require('phpjs');
var async = require('async');
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

        if (!obj) {
            return res.sendError(res.__('data_not_found'));
        }

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

            res.sendSuccess(res.__('data_updated'), obj);

        });
    });

};
/**
 * Find all users by org id
 * @param req
 * @param res
 */
OrganizationController.allUsers = function (req, res) {

    var criteria = { permissions: { $elemMatch: { organization: ObjectId(req.params.organizationId), activate: true }}};

    if(req.query.pending){
        criteria = { permissions: { $elemMatch: { organization: ObjectId(req.params.organizationId) }}};
    }
    //User.find({permissions: {$elemMatch: {organization: ObjectId(req.params.organizationId)}}}, function (err, users) {
    User.find(criteria, function (err, users) {

        if (err)  { return res.sendError(err); }

        var tmp = [];

        users.forEach(function(user){

            var permission = user.getCurrentPermission(req.params.organizationId);

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
 *
 * @param req
 * @param res
 */
OrganizationController.pending = function (req, res) {

    var crit = { permissions: { $elemMatch: { organization: ObjectId(req.params.organizationId), activate: false }}};

    User.find(crit, function (err, users) {

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

        if(!user) {
            return res.sendError(res.__('user_not_found'));
        }

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

    if (req.body.organization) {
        permissions.organization = ObjectId(req.body.organization);
    }

    permissions.students = req.body.students || [];

    permissions.role = req.body.role || 'case-worker';

    permissions.is_special_case_worker = req.body.is_special_case_worker || false;

    permissions.activate = req.body.activate || true;

    permissions.activateStatus = permissions.activate ? 'Active' : 'Pending';

    permissions.students = req.body.students || [];

    permissions.permissions = req.body.permissions || [];

    permissions.created = new Date();

    permissions.creator = req.user.userId;

    permissions.last_updated = new Date();

    permissions.last_updated_by = req.user.userId;

    if (_.isEmpty(permissions)) {
        return res.sendError(res.__('parameter_required'));
    }

    User.findOne({_id: ObjectId(userId)}, function (err, user) {

        if (err)  { return res.sendError(err); }

        if (!user) {
            return res.sendError(res.__('user_not_found'));
        }

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

        if(allpermission.length === 0) {
            allpermission.push(permissions);
        }



        User.where({_id: user._id}).update({$set: {permissions: allpermission}, last_updated: new Date(), last_updated_by: req.user.userId }, function (err, updated) {

            if (err)  { return res.sendError(err); }

            user.permissions = allpermission;

            user.getCurrentPermission(orgId);

            res.xmlOptions = 'user';

            res.sendSuccess(res.__('success_add_to', { name: 'Organization', to: 'User'}), user);

        });

    });

};
/**
 *
 * @param req
 * @param res
 */
OrganizationController.putUser = function (req, res) {

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

    res.xmlOptions = 'user';

    User.findOne({_id: ObjectId(req.params.userId)}, function (err, obj) {

        if (err) { return res.sendError(err); }

        if (!obj) {
            return res.sendError(res.__('data_not_found'));
        }


        // set update time and update by user
        obj.last_updated = new Date();

        obj.last_updated_by = req.user.userId;

        var role = null;

        ["first_name", "middle_name", "last_name", "password", "is_super_admin"].forEach(function(prop){

            if(prop in req.body) {
                obj[prop] = req.body[prop];
            }

        });

        if(req.body.role){

            role = req.body.role;
            /**
             * Filter if user downgrade here role
             */
            if(req.user._id.toString() === obj._id.toString() && req.user.isAdmin()){

                if(role.indexOf('case-worker') !== -1) {
                    return res.sendError(res.__('admin_never_able_to_downgrade'));
                }

            }

            var fields = { role: role };

            if(req.body.activate){

                fields.activate = req.body.activate ? true : false;

            }

            obj.saveWithRole(req.user, req.params.organizationId, fields, function (err, user) {

                if (err)  { return res.sendError(err); }

                res.sendSuccess(res.__('data_updated'), user);

            });

        } else {

            obj.saveWithRole(req.user, req.params.organizationId, function (err, user) {

                if (err)  { return res.sendError(err); }

                res.sendSuccess(res.__('data_updated'), user);

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


        if (!user) {
            return res.sendError(res.__('user_not_found'));
        }

        var allpermission = [];

        for (var i = 0; i < user.permissions.length; i++) {

            if (req.params.organizationId !== (user.permissions[i].organization + '')) {

                allpermission.push(user.permissions[i]);

            }
        }

        User.where({_id: user._id}).update({$set: {permissions: allpermission}, last_updated: new Date(), last_updated_by: req.user.userId }, function (err, updated) {

            if (err)  { return res.sendError(err); }

            res.sendSuccess(res.__('data_deleted'));

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

    Program.find(crit, function (err, programs) {

        if (err) {
            return res.sendError(err);
        }

        var ids = [];
        var ps = [];
        var psi = {};
        var i = 0;
        programs.forEach(function(p){
            ids.push(p._id);
            var c = {
                _id: p._id,
                name: p.name,
                organization: p.organization,
                totalStudent: 0,
                totalActive: 0,
                cohorts: [],
                created: p.created,
                creator: p.creator,
                last_updated: p.last_updated,
                last_updated_by: p.last_updated_by
            };
            psi[p._id.toString()] = i;
            ps.push(c);
            i++;
        });

        Student.protect(req.user.role, { onlyAssign: true }, req.user).find({ organization: crit.organization, programs: { $elemMatch: { program: { $in: ids } } } }, function(err, students){

            if (err)  { return res.sendError(err); }

            students.forEach(function(s){
                s.programs.forEach(function(sp){
                    var id = sp.program + '';
                    if(id in psi){
                        var j = psi[id];
                        ps[j].totalStudent++;
                        if(sp.active === true){
                            ps[j].totalActive++;
                        }
                        if(sp.cohort){
                            sp.cohort.forEach(function(c){
                                if(ps[j].cohorts.indexOf(c) === -1){
                                    ps[j].cohorts.push(c);
                                }
                            });
                        }

                    }
                });
            });

            res.sendSuccess(null, ps);

        });

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

        if (!obj) return res.sendError(res.__('data_not_found'));

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

            res.sendSuccess(res.__('data_added'), obj);

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

        if (!obj) return res.sendError(res.__('data_not_found'));

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

            res.sendSuccess(res.__('data_updated'), obj);

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

        res.sendSuccess(res.__('data_deleted'));

    });

};
/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = OrganizationController;
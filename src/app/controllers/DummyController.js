'use strict';
/**
 * Created by zaenal on 03/06/15.
 */
var mongoose = require('mongoose');
var Student = require('../models/Student');
var User = require('../models/User');
var Organization = require('../models/Organization');
var BaseController = require('./BaseController');
var _ = require('underscore');
var Request = require('../../lib/broker/request');
var parseString = require('xml2js').parseString;
var ObjectId = mongoose.Types.ObjectId;
var DummyController = new BaseController(Student).crud();
/**
 *
 * @param req
 * @param res
 */
DummyController.index = function(req, res){
    /**
     *
     */
    Student.findOne().exec(function(err, std){

        var studentId = std._id;

        var orgId = std.organization;

        User.findOne({email: req.query.email || req.body.email }, function(err, user){

            if (err)  { return res.sendError(err); }

            if(!user) { return res.sendError(res.__('record_not_found', 'User')); }

            Student.protect(user.role, { students: studentId }, user).findOne({_id: studentId, organization: orgId}, function (err, student) {

                if (err)  { return res.sendError(err); }

                if(!student) { return res.sendError(res.__('record_not_found', 'User')); }

                res.sendSuccess('OK');
            });

            //Student.protect(user.role, null, user).find({organization: orgId}, function (err, students) {
            //
            //    if (err)  { return res.sendError(err); }
            //
            //    res.sendSuccess(null, students);
            //});
        });
    });

};
/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = DummyController;
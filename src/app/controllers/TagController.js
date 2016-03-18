'use strict';
/**
 * Created by zaenal on 03/06/15.
 */
var mongoose = require('mongoose');
var Tag = require('../models/Tag');
var User = require('../models/User');
var Organization = require('../models/Organization');
var BaseController = require('./BaseController');
var _ = require('underscore');
var Request = require('../../lib/broker/request');
var parseString = require('xml2js').parseString;
var utils = require('../../lib/utils'), cache = utils.cache();
var ObjectId = mongoose.Types.ObjectId;
var slug = require('slug');
var TagController = new BaseController(Tag).crud();

/**
 * Get all tag in organization
 * @param req
 * @param res
 */
TagController.getTags = function (req, res) {

    res.xmlKey = 'tags';

    var orgId = ObjectId(req.params.organizationId);

    Tag.find({organization: orgId}, function (err, tags) {

        if (err)  { return res.sendError(err); }

        res.sendSuccess(null, tags);

    });

};
/**
 *
 * @param req
 * @param res
 */
TagController.createByOrgId = function (req, res) {

    res.xmlOptions = 'tag';

    var obj = new Tag(req.body);

    obj.organization = mongoose.Types.ObjectId(req.params.organizationId);

    obj.slug = slug(obj.name+'');

    // set update time and update by user
    obj.created = new Date();

    obj.creator = req.user.userId;

    obj.last_updated = new Date();

    obj.last_updated_by = req.user.userId;

    obj.save(function (err) {

        if (err)  {
            return res.sendError(err);
        }

        res.sendSuccess(res.__('data_added'), obj);

    });

};
/**
 * Get tag organization by id
 * @param req
 * @param res
 */
TagController.getTagById = function (req, res) {

    res.xmlOptions = 'tag';

    var orgId = req.params.organizationId;

    var tagId = ObjectId(req.params.tagId);

    Tag.findOne({ organization: ObjectId(orgId), _id: tagId }, function (err, tag) {

        if (err)  { return res.sendError(err); }
        /**
         * If tag is empty from database
         */
        if (!tag) {
            return res.sendError(res.__('record_not_found', 'Tag'));
        }

        res.sendSuccess(tag);

    });

};
/**
 *
 * @param req
 * @param res
 */
TagController.deleteTagById = function (req, res) {

    var orgId = req.params.organizationId;

    var tagId = ObjectId(req.params.tagId);

    Tag.remove({ organization: ObjectId(orgId), _id: tagId }, function (err, tag) {

        if (err)  { return res.sendError(err); }

        res.sendSuccess(res.__('data_deleted'));

    });

};
/**
 *
 * @param req
 * @param res
 */
TagController.putTagById = function(req, res){

    res.xmlOptions = 'tag';

    var tagId = ObjectId(req.params.tagId);

    Tag.findOne({ _id: tagId, organization: ObjectId(req.params.organizationId) }, function (err, obj) {

        if (err) { return res.sendError(err); }

        if (!obj) {
            return res.sendError(res.__('data_not_found'));
        }

        for (var prop in req.body) {

            if(prop in obj) {

                obj[prop] = req.body[prop];

            }

        }

        obj.slug = slug(obj.name);

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
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = TagController;
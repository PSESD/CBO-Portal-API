/**
 * Created by zaenal on 01/03/16.
 */
'use strict';
/**
 * Created by zaenal on 03/06/15.
 */
var mongoose = require('mongoose');
var async = require('async');
var moment = require('moment');
var crypto = require('crypto');
var User = require('../models/User');
var Client = require('../models/Client');
var Token = require('../models/Token');
var Organization = require('../models/Organization');
var BaseController = require('./BaseController');
var _ = require('underscore');
var php = require('phpjs');
var Request = require('../../lib/broker/request');
var parseString = require('xml2js').parseString;
var utils = require('../../lib/utils'), cache = utils.cache(), redirectUri = utils.getOrganizationUri;
var ObjectId = mongoose.Types.ObjectId;
var slug = require('slug');
var ApplicationController = new BaseController(Client).crud();

/**
 * Get all application in organization
 * @param req
 * @param res
 */
ApplicationController.get = function (req, res) {

    res.xmlKey = 'applications';

    var orgId = req.params.organizationId;

    Client.find({ id: { $regex: '^' + orgId + '_', $options: 'i' } }, function (err, clients) {

        if (err)  { return res.sendError(err); }

        async.map(clients, function(client, cb){

            User.findOne({ _id: ObjectId(client.userId) }, function(e, u){

                cb(null, {
                    _id: client._id,
                    app_name: client.name,
                    created_by: client.created_by,
                    created: client.created,
                    email: u.email,
                    callback_url: client.redirectUri
                });

            });


        }, function(err, results){

            if(err){
                return res.sendError(err);
            }

            res.sendSuccess(null, results);
        });

    });

};
/**
 *
 * @param text
 * @returns {string}
 */
function slugify(text)
{
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}
/**
 *
 * @param text
 * @param key
 * @returns {*}
 */
function encrypt(text, key){
    var cipher = crypto.createCipher('aes256', slugify(key));
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}
/**
 *
 * @param text
 * @param key
 * @returns {*}
 */
function decrypt(text, key){
    var decipher = crypto.createDecipher('aes256', slugify(key));
    return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
}

/**
 *
 * @param req
 * @param res
 */
ApplicationController.post = function (req, res) {

    res.xmlOptions = 'application';

    var orgId = req.params.organizationId;

    var clientId = orgId + '_' + slugify(req.body.app_name);

    var userId = req.body.user_id;

    var callbackUrl = req.body.callback_url;

    var secret = utils.tokenHash(utils.uid(12));

    Organization.findOne({ _id: ObjectId(orgId)}, function(err, organization){

        if(err){
            return res.sendError(err);
        }

        var client = new Client({
            name: organization.name + ' - ' + req.body.app_name, //name must unique
            id: clientId,
            userId: userId,
            secret: secret,
            redirectUri: callbackUrl || redirectUri(req),
            created_by: req.user.userId
        });

        client.save(function (err) {

            if(err){
                return res.sendError(err);
            }

            res.sendSuccess(res.__('data_added'), {
                clientId: client.id,
                secretKey: client.secret,
                redirectUri: client.redirectUri,
                appName: client.name,
                userId: client.userId,
                dateCreated: client.created
            });


        });

    });

};
/**
 *
 * @param req
 * @param res
 */
ApplicationController.delete = function (req, res) {

    var applicationId = ObjectId(req.params.applicationId);

    var client = Client.findOne({ _id: applicationId }, function(err, client){

        if (err)  {
            return res.sendError(err);
        }

        var clientId = client._id;

        client.remove(function (err) {

            if (err)  { return res.sendError(err); }

            Token.remove({ clientId: clientId }, function (err) {

                if (err) {
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
module.exports = ApplicationController;
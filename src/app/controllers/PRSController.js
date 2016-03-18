'use strict';
/**
 * Created by zaenal on 07/07/15.
 */
var mongoose = require('mongoose');
var Student = require('../models/Student');
var User = require('../models/User');
var Organization = require('../models/Organization');
var BaseController = require('./BaseController');
var _ = require('underscore');
var Request = require('../../lib/broker/request');
var parseString = require('xml2js').parseString;
var utils = require('../../lib/utils'), cache = utils.cache(), log = utils.log, md5 = utils.md5;
var ObjectId = mongoose.Types.ObjectId;
var PRSController = new BaseController(null).crud();

/**
 * Get the list of all organizations that this user have access to in our system.
 * @param req
 * @param res
 * @returns {*}
 */
PRSController.getDistricts = function (req, res) {


    var brokerRequest = new Request();

    var key = md5(['getDistricts', req.params.organizationId].join('_'));

    cache.get(key, function(err, result){

        if(err) { utils.log(err); }

        if(!result){

            console.log("GET FROM SERVER");

            brokerRequest.createPsr('districts', function (error, response, body) {

                if (error)  {
                    return res.sendError(error);
                }

                if (!body) {
                    return res.sendError(res.__('data_not_found'));
                }

                if (response && response.statusCode === '200') {

                    utils.xml2js(body, function (err, result) {

                        var json = result.ArrayOfDistrictSummary;

                        delete json.$;

                        cache.set(key, json, function(err){

                            utils.log(err);

                            res.sendSuccess(json);

                        });

                    });

                } else {

                    utils.xml2js(body, function (err, result) {

                        var json = (result && 'error' in result) ? result.error.message : res.__('error_response');

                        res.sendError(json);

                    });
                }
            });
        } else {

            //console.log("GET FROM CACHE");

            res.sendSuccess(result);

        }

    });


};
/**
 *
 * @param req
 * @param res
 */
PRSController.deleteCacheDistricts = function (req, res) {

    var key = md5(['getDistricts', req.params.organizationId].join('_'));

    cache.del(key, function(err, result){

        if (err){

            log(err, 'error');

            return res.sendError(res.__('cache_deleted_error'));

        }

        res.sendSuccess(res.__('cache_deleted'));

    });

};
/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = PRSController;
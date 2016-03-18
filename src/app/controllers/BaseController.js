'use strict';
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var User = require('../models/User');
var _ = require('underscore');
/**
 * Created by zaenal on 05/06/15.
 */
function BaseController(model){
    this.model = model;
    this.crud();
}
/**
 *
 * @returns {{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
BaseController.prototype.crud = function(idName) {
    var self = this;

    var id = idName || 'id';

    return {

        /**
         *
         * @param req
         * @param res
         */
        create: function (req, res) {

            var newModel = self.model;

            var obj = new newModel(req.body);

            // set update time and update by user
            if(!obj.created) {
                obj.created = new Date();
            }

            if(!obj.creator) {
                obj.creator = req.user.userId;
            }

            if(!obj.last_updated) {
                obj.last_updated = new Date();
            }

            if(!obj.last_updated_by) {
                obj.last_updated_by = req.user.userId;
            }

            obj.save(function (err) {

                if (err)  {
                    return res.sendError(err);
                }

                return res.sendSuccess(res.__('data_added'), obj);

            });
        },
        /**
         *
         * @param req
         * @param res
         */
        save: function (req, res) {

            self.model.findOne({ _id: ObjectId(req.params[id]) }, function (err, obj) {

                if (err)  {
                    return res.sendError(err);
                }

                if(!obj) {
                    return res.sendError(res.__('data_not_found'));
                }

                for (var prop in req.body) {

                    if(prop in obj) {

                        obj[prop] = req.body[prop];

                    }
                }

                if(!obj.last_updated) {
                    obj.last_updated = new Date();
                }

                if(!obj.last_updated_by) {
                    obj.last_updated_by = req.user.userId;
                }

                // save the movie
                obj.save(function (err) {

                    if (err)  {
                        return res.sendError(err);
                    }

                    res.sendSuccess(res.__('data_updated'), obj);

                });
            });
        },
        /**
         *
         * @param req
         * @param res
         */
        get: function (req, res) {

            self.model.findOne({ _id: ObjectId(req.params[id]) }, function (err, obj) {

                if (err)  {
                    return res.sendError(err);
                }

                res.json(obj);

            });
        },
        /**
         *
         * @param req
         * @param res
         */
        all: function (req, res) {

            self.model.find(function (err, objs) {

                if (err)  {
                    return res.sendError(err);
                }

                res.json(objs);

            });
        },
        /**
         *
         * @param req
         * @param res
         */
        delete: function (req, res) {
            self.model.remove({
                _id: ObjectId(req.params[id])
            }, function (err, obj) {

                if (err) { return res.sendError(err); }

                res.sendSuccess(res.__('data_deleted'));

            });
        }
    };
};
/**
 *
 * @type {BaseController}
 */
module.exports = BaseController;
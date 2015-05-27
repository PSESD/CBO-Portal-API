/**
 * Created by zaenal on 21/05/15.
 */
var model = require('../models/Organization');
var Model = require('../../lib/model');
var extend = require('util')._extend;
var self = new Model(model);
var OrganizationController = extend(self.crud(), {
    get: function(req, res){
        self.model.findOne({ username: req.user.username}, function(err, obj) {
            if (err) {
                return res.send(err);
            }
            res.json(obj);
        });
    },
    /**
     *
     * @param req
     * @param res
     */
    save: function(req, res){
        self.model.findOne({ _id: req.user._id }, function(err, obj) {
            if (err) {
                return res.send(err);
            }

            for (prop in req.body) {
                obj[prop] = req.body[prop];
            }

            // save the movie
            obj.save(function (err) {
                if (err) {
                    return res.send(err);
                }

                res.json({message: 'Successfully updated!'});
            });
        });
    },
    profile: function(req, res){

    },
    allUsers: function(req, res){

    },
    getUser: function(req, res){

    },
    allProgram: function(req, res){

    },

    getProgram: function(req, res){

    }
});

module.exports = OrganizationController;
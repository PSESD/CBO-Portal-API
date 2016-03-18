'use strict';
/**
 * Created by zaenal on 03/06/15.
 */
var mongoose = require('mongoose');
var Student = require('./../../app/models/Student');
var Program = require('./../../app/models/Program');
var User = require('./../../app/models/User');
var Organization = require('./../../app/models/Organization');
var _ = require('underscore');
var Request = require('./../../lib/broker/request');
var parseString = require('xml2js').parseString;
var utils = require('./../../lib/utils'), cache = utils.cache(), log = utils.log, md5 = utils.md5;
var ObjectId = mongoose.Types.ObjectId;
var hal = require('hal');
var php = require('phpjs');
var xSre = require('./../../lib/xsre');
var async = require('async');
var StudentCache = {};

/**
 * Get the list of all organizations that this user have access to in our system.
 * @returns {*}
 */
StudentCache.cache = function () {

      Organization.find({}, function(err, organizations){

            if(err) {
                return log(err);
            }

            _.each(organizations, function(organization){

                  Student.find({
                        organization: organization._id
                  }, function(err, students){

                        _.each(students, function(student){

                              var orgId = organization._id;

                              var studentId = student._id;

                              if(err) {
                                  return log(err);
                              }
                              /**
                               * If student is empty from database
                               */
                              if(!student) {
                                  return log('The student not found in database');
                              }

                              var key = md5([orgId.toString(), studentId.toString(), student.district_student_id, student.school_district].join('_'));

                              var brokerRequest = new Request({
                                    externalServiceId: organization.externalServiceId,
                                    personnelId: organization.personnelId,
                                    authorizedEntityId: organization.authorizedEntityId
                              });

                              brokerRequest.createXsre(student.district_student_id, student.school_district, function(error, response, body){

                                    if(error)  {
                                        return log(error);
                                    }

                                    if(!body){

                                          return log('Data not found in database xsre');

                                    }

                                    if(response && response.statusCode === 200){

                                          utils.xml2js(body, function(err, result){

                                                if(err) {
                                                    return log(err);
                                                }

                                                var object = new xSre(result, body).toObject();
                                                /**
                                                 * Set to cache
                                                 */
                                                cache.set(key, object, function(err){

                                                      return log(err);

                                                });

                                          });

                                    } else{

                                          utils.xml2js(body, function(err, result){

                                                var json = (result && 'error' in result) ? result.error.message : 'Error not response';

                                                return log(json);

                                          });
                                    }
                              });

                        });
                  });
            });

      });
};

/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = StudentCache;
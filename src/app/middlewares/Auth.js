'use strict';
/**
 *
 * @type {Passport|exports|module.exports}
 */
// Load required packages
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var User = require('../models/User');
var Client = require('../models/Client');
var Access = require('../access/access');
var Token = require('../models/Token');
var tokenHash = require('../../lib/utils').tokenHash;
var requestIp = require('request-ip');

passport.use(new BasicStrategy(
    
  function(username, password, callback) {

    User.findOne({ email: username }, function (err, user) {

      if (err) { return callback(err); }

      // No user found with that username
      if (!user) { return callback(null, false); }

      // Make sure the password is correct
      user.verifyPassword(password, function(err, isMatch) {

        if (err) { return callback(err); }

        // Password did not match
        if (!isMatch) { return callback(null, false); }

        // Success
        return callback(null, user);

      });

    });

  }

));


passport.use(new BearerStrategy({ passReqToCallback: true }, function(req, accessToken, callback) {

    var accessTokenHash = tokenHash(accessToken);

    var clientIp = requestIp.getClientIp(req);

    Token.findOne({ token: accessTokenHash }, function (err, token) {

      if (err) {

        return callback(err);

      }

      // No token found
      if (!token) {

        return callback(null, false);

      }

      if((typeof token.ip === 'undefined' && clientIp === '127.0.0.1') || token.ip === '*'){

          clientIp = token.ip;

      }

      //check for ip token
      if(token.ip !== clientIp){

        console.log('IP TOKEN: ', token.ip, ' => CLIENT IP: ', clientIp);

        callback(null, false, { message: 'Token not verified' });

      } else if (new Date() > token.expired) {//check for expired token

        token.remove(function (err) {

          if (err) { return callback(err); }

          callback(null, false, { message: 'Token expired' });

        });


      } else {

        User.findOne({ _id: token.userId }, function (err, user) {

          if (err) { return callback(err); }

          // No user found
          if (!user) { return callback(null, false); }

          // Simple example with no scope
          callback(null, user, { scope: '*', token: token });

        });

      }

    });

  }

));

/**
 * Middleware function for check authorize
 */
exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], { session : false });

exports.hasAccess = Access.hasAccess;

exports.isAdmin = Access.isAdmin;

exports.isBearerAuthenticated = passport.authenticate('bearer', { session: false });
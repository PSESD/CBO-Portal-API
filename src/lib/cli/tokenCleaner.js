'use strict';
/**
 * Created by zaenal on 22/09/15.
 */

var mongoose = require('mongoose');
require('./db');
var Token = require('../../app/models/Token');
var async = require('async');


module.exports = {
    /**
     *
     */
    clean: function(done){

        //Token.find({ expired: { $lte: new Date() }}, function(err, tokens){
        //    if(err){
        //        return console.log('Error Token Cleaner', err);
        //    }
        //    console.log(tokens);
        //});

        Token.remove({ expired: { $lte: new Date() }}, done);

    }
};
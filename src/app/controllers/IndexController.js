'use strict';
/**
 * Created by zaenal on 20/05/15.
 */
var utils = require('../../lib/utils'), cache = utils.cache(), log = utils.log, md5 = utils.md5, benchmark  = utils.benchmark();

var IndexController = {

    index: function(req, res){

        res.json({ "test": res.__('welcome_api')});

    },
    /**
     *
     * @param req
     * @param res
     */
    rollbar: function(req, res){
        log(req.message, req.type, function(err, payloadData){

            if(err){
                  return res.sendError(err);
            }

            res.sendSuccess('OK');
        });
    }

};
/**
 *
 * @type {{index: Function}}
 */
module.exports = IndexController;
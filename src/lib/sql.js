/**
 * Created by zaenal on 23/02/16.
 */
var mysql = require('mysql');
var utils = require('../lib/utils');
var config = utils.config();
var dbConfig = config.get('db').mysql;

//console.log('CONFIG MYSQL: ', dbConfig);
//console.log('NODE_CONFIG_DIR: ' + config.util.getEnv('NODE_CONFIG_DIR'));
//console.log('NODE_APP_INSTANCE: ' + config.util.getEnv('NODE_APP_INSTANCE'));
//console.log('ALLOW_CONFIG_MUTATIONS: ' + config.util.getEnv('ALLOW_CONFIG_MUTATIONS'));
module.exports = mysql.createConnection({
    host     : dbConfig.host,
    user     : dbConfig.user,
    password : dbConfig.password,
    database : dbConfig.database
});
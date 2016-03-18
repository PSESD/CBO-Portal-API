/**
 * Created by zaenal on 08/01/16.
 */
'use strict';
/**
 *
 */
(function(){
    var dotenv = require('dotenv').config({ path: process.env.NODE_CONFIG_DIR + '/.env' });
    if(dotenv){
        for(var env in dotenv){
            process.env[env] = dotenv[env];
        }
    }
})();


var memwatch = require('memwatch');
// Take first snapshot
var hd = new memwatch.HeapDiff();
var bs = require('nodestalker'),
    tube = 'test_tube',
    what = process.argv.slice(2)[0],
    client = bs.Client('127.0.0.1:11300');
var utils = require('./lib/utils');


var config = utils.config();
var os = require('os');
//var con = require('./lib/sql');
var studentCollector = require('./lib/cli/studentCollector');
var tokenCleaner = require('./lib/cli/tokenCleaner');
var request = require('./lib/cli/request');
var php = require('phpjs');
var codeSet = require('./lib/xsre/codeset');
var parseString = require('xml2js').parseString;
var rollbar = require('rollbar');
var rollbarEnv = config.util.getEnv('NODE_ENV');

var rollbarAccessToken = config.get('rollbar.access_token');
rollbar.init(rollbarAccessToken, {
    environment: rollbarEnv
});

var subjectEmail = '[SSL] Scheduled Task Report for ${environment}:${hostname} on ${datetime}';
var bodyEmail = 'On ${datetime} the following scheduled tasks have been performed in ${environment}:';
var emailCacheList = '${status} pulling ${number_of_students} students from the P2 Broker and pushing it to ${redis_host}';
var emailPullCedarExpert = '${status} pulling ${number_of_students} students from CedarExperts';
var emailPushCedarExpert = '${status} pushing ${number_of_students} students to CedarExperts';
var emailPushSqlReport = '${status} pushing ${number_of_students} students from CedarExperts to MySQL DB: ${mysql_host}.';
var emailPullCodeSet = '${status} pulling codeset done.';
// Configure the library to send errors to api.rollbar.com
rollbar.handleUncaughtExceptions(rollbarAccessToken, { exitOnUncaughtException: true });

function processJob(job, callback){
    // doing something really expensive
    console.log('processing...');
    setTimeout(function(){
        var objectData = JSON.parse(job.data);
        console.log('PUSH DATA: ', objectData);
         //request.push(objectData.content, callback);
    }, 1000);
}

process.on('uncaughtException', function (err) {

    utils.log(err, 'error');

});
/**
 *
 */
function resJob(){
    client.watch(tube).onSuccess(function(data){
        client.reserve().onSuccess(function(job){
            console.log('received job:', job);

            processJob(job, function(){
                client.deleteJob(job.id).onSuccess(function(del_msg){
                    console.log('deleted', job);
                    console.log(del_msg);
                    //client.disconnect();
                });
                console.log('processed', job);
            });
        });
    });
}

function pullJob(){
    console.log('PULL CALL HERE');
    client.use(tube).onSuccess(function(data){

        studentCollector.collect(function(bulkStudent){
            //console.log(student);
            client.put(bulkStudent).onSuccess(function(job_id){
                console.log('DATA: ', job_id);
            });
        });

    });
}
/**
 *
 * @param err
 * @param message
 * @param params
 * @param done
 */
function withError(err, message, params, done){
    params = params || {};
    params.status = 'Failed';

    if(err){
        if(err instanceof Error){
            err = err.stack.split("\n");
        }
        utils.log('Error: ' + php.nl2br(err), 'error', function () {
            sentItEmail(message, params, done, err);
        });
    } else {
        sentItEmail(message, params, done);
    }
}
/**
 *
 * @param message
 * @param params
 * @param done
 */
function withSuccess(message, params, done){
    params = params || {};
    params.status = 'Successfully';
    sentItEmail(message, params, done);
}
/**
 *
 * @param message
 * @param params
 * @param done
 * @param err
 */
function sentItEmail(message, params, done, err){
    var iregex = [
        '${environment}',
        '${hostname}',
        '${datetime}',
        '${redis_host}',
        '${mysql_host}'
    ];
    var ireplace = [
        process.env.NODE_ENV,
        os.hostname(),
        new Date().toString(),
        config.get('cache.redis.host'),
        config.get('db.mysql.host')
    ];
    for(var i in params){
        iregex.push('${'+i+'}');
        ireplace.push(params[i]);
    }

    var subject = php.str_replace( iregex, ireplace, subjectEmail);
    message = php.str_replace(iregex, ireplace, message);
    bodyEmail = php.str_replace(iregex, ireplace, bodyEmail);
    message = bodyEmail + "<br><br>" + message;
    if(err){
        message += '<br><strong>' +
        '\nWith Error: ' + err + '<strong>';
    }
    //add Memory information usage
    var diff = hd.end();
    if(diff.change && diff.change.details){
        delete diff.change.details;
    }
    message = php.nl2br(message) + "<br><br>" +
        "Leak Detection and Heap Diffing:<br>" +
        "<pre><code>Before: " + JSON.stringify(diff.before) + '</code></pre>' +
        "<pre><code>After: " + JSON.stringify(diff.after) + '</code></pre>' +
        "<pre><code>Change: " + JSON.stringify(diff.change) + '</code></pre>';
    if('SKIP_EMAIL' in process.env && process.env.SKIP_EMAIL === 'y'){
        return done();
    }
    utils.mailDev(message, subject, done);
}

switch(what){
    case 'env':
        utils.log('Environment: '+ config.util.getEnv('NODE_ENV'), 'info', function(){
            process.exit();
        });

        break;
    case 'test':
        withSuccess(emailPushSqlReport, { number_of_students: 200 }, function(){
            process.exit();
        });
        break;
    case 'checking':
        if(!config.has('db')){
            console.log(JSON.stringify(config.util.getConfigSources()));
        } else {
            console.log('OK', config);
        }
        process.exit();
        break;
    case 'push-cedarlabs':
        studentCollector.collect(function(bulkStudent, studentNumber){
                require('fs').writeFile(__dirname + '/data/REQUEST-CBOStudents.xml', bulkStudent, function (err) {});
                (new request()).push(bulkStudent, function(err, response, body){
                    require('fs').writeFile(__dirname + '/data/RESPONSE-CBOStudents.xml', body, function (err) {
                        if (err && err !== null && err !== 'null') {
                            withError(err, emailPushCedarExpert, { number_of_students: studentNumber }, function (err) {
                                process.exit();
                            });
                        } else {
                            withSuccess(emailPushCedarExpert, { number_of_students: studentNumber }, function (err) {
                                process.exit();
                            });
                        }
                    });
                });

        });
        break;
    case 'pull-cedarlabs':
        studentCollector.pullStudentAsync(function(err, studentNumber){
            if (err && err !== null && err !== 'null') {
                withError(err, emailPushSqlReport, { number_of_students: studentNumber }, function (err) {
                    process.exit();
                });
            } else {
                withSuccess(emailPushSqlReport, { number_of_students: studentNumber }, function (err) {
                    process.exit();
                });
            }
        });
        break;
    case 'codeset':
        (new request()).codeSet(function(err, res, body){
            if (err && err !== null && err !== 'null') {
                withError(err, emailPullCodeSet, {}, function (err) {
                    process.exit();
                });
            } else {
                withSuccess(emailPullCodeSet, {}, function (err) {
                    process.exit();
                });
            }
        });
        break;
    case 'cache-list':
        var args = process.argv.slice(3)[0] ? true : false;
        studentCollector.cacheList(args, function(err, data, studentNumber){
            if (err && err !== null && err !== 'null') {
                withError(err, emailCacheList, { number_of_students: studentNumber }, function (err) {
                    process.exit();
                });
            } else {
                withSuccess(emailCacheList, { number_of_students: studentNumber }, function (err) {
                    process.exit();
                });
            }
        });
        break;
    case 'activate':
        studentCollector.activateUser(function(err){
            if(err){
                console.log(err);
            }
            process.exit();
        });
        break;
    case 'token-cleaner':
        tokenCleaner.clean(function(err){
            if (err && err !== null && err !== 'null') {
                console.log('Remove expire token fails: ', err);
            } else{
                console.log('Remove expire token done');
            }
            process.exit();
        });
        break;
    default:
        throw 'Not valid command';
        //resJob();
        //break;
}
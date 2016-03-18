'use strict';
var fs = require('fs');
var util = require('util');
/**
 *
 * @param file
 * @constructor
 */
function CodeSet(file){
    this.filename = __dirname + '/config.js';
    this.file = file || require(__dirname + '/json-codeset.json');

}

/**
 *
 * @returns {*}
 */
CodeSet.prototype.get = function(){

    return require(this.filename);

};

/**
 *
 */
CodeSet.prototype.parse = function(done){


    var file = this.file;

    var codeSets = {};

    file.codeSet.forEach(function(codeSet, key){

        codeSets[codeSet.id] = {};

        codeSet.codeItems.codeItem.forEach(function(codeItem){

            delete codeItem.action;

            delete codeItem.timestamp;

            codeSets[codeSet.id][codeItem.code] = codeItem;

        });

    });

    var io = util.inspect(codeSets, false, null);

    fs.writeFile(this.filename, 'module.exports = ' + io + ';', function (err) {

        if (err) {
            throw err;
        }

        console.log('It\'s saved!');

        console.log(Object.keys(require(__dirname + '/config.js')));

        if(typeof done === 'function') {
            done();
        }

    });

    console.log(io);

};




module.exports = CodeSet;
//var uuid = require('node-uuid');
//var TIME = 1321644961388; // 2011-11-18 11:36:01.388-08:00
//console.log(uuid.v1());
//console.log(uuid.v4());
//console.log(uuid.v1({msecs: TIME - 10*3600*1000}));
//console.log(uuid.v1({msecs: TIME - 1}));
//console.log(uuid.v1({msecs: TIME}));
//console.log(uuid.v1({msecs: TIME + 1}));
//console.log(uuid.v1({msecs: TIME + 28*24*3600*1000}));
var i = 0;
setTimeout(function(){
    'use strict';
    console.log('Hallo ' + (i++));
}, 1000);

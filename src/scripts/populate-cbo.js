/**
 * Created by zaenal on 21/05/15.
 */
var Address         = require('../app/models/Address');
var Client          = require('../app/models/Client');
var Code            = require('../app/models/Code');
var Organization    = require('../app/models/Organization');
var Permission      = require('../app/models/Permission');
var Program         = require('../app/models/Program');
var RefreshToken    = require('../app/models/RefreshToken');
var Student         = require('../app/models/Student');
var StudentProgram  = require('../app/models/StudentProgram');
var Token           = require('../app/models/Token');
var User            = require('../app/models/User');
var UserPermission  = require('../app/models/UserPermission');


var fs              = require('fs');
var csv             = require('fast-csv');
var filecsv         = __dirname + '/Pilot CBOs.csv';

var async = require('async')
var _ = require('underscore')

var Helpers = function(mongoose) {
    this.mongoose = mongoose || require('mongoose');

    this.dropCollections = function(callback) {
        var collections = _.keys(mongoose.connection.collections)
        async.forEach(collections, function(collectionName, done) {
            var collection = mongoose.connection.collections[collectionName]
            collection.drop(function(err) {
                if (err && err.message != 'ns not found') done(err)
                done(null)
            })
        }, callback)
    }
};

var mongoose = mongoose || require('mongoose');

var populateCbo = {

    dropCollections: function(callback) {
        var collections = _.keys(mongoose.connection.collections);
        async.forEach(collections, function(collectionName, done) {
            var collection = mongoose.connection.collections[collectionName];
            collection.drop(function(err) {
                if (err && err.message != 'ns not found') done(err);
                done(null);
            })
        }, callback);
    },
    city: function(name){
        var address = {
            address_type:"Mailing",
            venue: "", // Optional venue name at the address, useful for names of buildings. (ex: Smith Hall)
            address_line: "",
            city: "",
            state: "",
            zip: "",
            country: "", // The country code according to ISO 3166-1 Alpha-2.
            location: {
                latitude: 0,
                longitude: 0,
                accuracy: ""//{type: String, enum: ["Rooftop", "Approximate"] }
            } //An object hash representing the geocoded location information for the address.
        };
        switch(name){
            case 'Aurburn':
                address.address_line = "";
                address.city = "Aurburn";
                address.state = "";
                address.zip = "";
                address.country = "";
                break;

            case 'Federal Way':
                address.address_line = "1627 S 312th St";
                address.city = "Federal Way";
                address.state = "";
                address.zip = "";
                address.country = "";
                break;

            case 'Highline':
                address.address_line = "";
                address.city = "Highline";
                address.state = "";
                address.zip = "";
                address.country = "";
                break;

            case 'Kent':
                address.address_line = "";
                address.city = "Kent";
                address.state = "";
                address.zip = "";
                address.country = "";
                break;

            case 'Renton':
                address.address_line = "";
                address.city = "Renton";
                address.state = "";
                address.zip = "";
                address.country = "";
                break;

            case 'Seattle':
                address.address_line = "";
                address.city = "Seattle";
                address.state = "";
                address.zip = "";
                address.country = "";
                break;

            case 'Tukwila':
                address.address_line = "";
                address.city = "Seattle";
                address.state = "";
                address.zip = "";
                address.country = "";
                break;

            default:
                return null;
        }
        return address;
    },

    run: function(){
        var self = this;
        var config = require('config');

        var done = function(){

        };
        self.dropCollections(function(){
            var stream = fs.createReadStream(filecsv);
            var psl = require('psl');
            var csvStream = csv
                .fromStream(stream, {ignoreEmpty: true })
                .on("data", function(row){
                    if(row[0] == 'CBO'){
                        return;
                    }
                    var rs = {
                        organization: row[0],
                        website: row[1],
                        services: row[2],
                        grade: row[3],
                        aurburn: row[4] == 'x' ? 'Aurburn' : null,
                        federal_way: row[5] == 'x' ? 'Federal Way' : null,
                        highline: row[6] == 'x' ? 'Highline' : null,
                        kent: row[7] == 'x' ? 'Kent' : null,
                        renton: row[8] == 'x' ? 'Renton' : null,
                        seattle: row[9] == 'x' ? 'Seattle' : null,
                        tukwila: row[10] == 'x' ? 'Tukwila' : null,
                        platforms: row[11],
                        contact: row[12],
                        email: row[13],
                        confirmed: row[14],
                        notes: row[15]
                    };

                    var parsed = psl.parse(rs.website);
                    rs.url = parsed.sld;
                    rs.username = rs.url;

                    if(!rs.url || !rs.email){
                        return;
                    }
                    var createOrg = function(err, user, permission){
                        if(err) return console.log(err);
                        var newOrg = {
                            name: rs.organization,
                            url: rs.url + '.' + config.get('host'),
                            website: rs.website,
                            description: rs.notes,
                            addresses: []
                        };
                        var addrs = null;
                        var addresses = [];
                        if(rs.aurburn && (addrs = self.city(rs.aurburn))) addresses.push(addrs);
                        if(rs.federal_way && (addrs = self.city(rs.federal_way))) addresses.push(addrs);
                        if(rs.kent && (addrs = self.city(rs.kent))) addresses.push(addrs);
                        if(rs.renton && (addrs = self.city(rs.renton))) addresses.push(addrs);
                        if(rs.seattle && (addrs = self.city(rs.seattle))) addresses.push(addrs);
                        if(rs.tukwila && (addrs = self.city(rs.tukwila))) addresses.push(addrs);

                        /**
                         * Start insert new record
                         */

                        Organization.findOneAndUpdate({ name: newOrg.name }, { $set: newOrg }, { upsert: true }, function (err, org) {
                            if(err) return console.log(err);
                            if(org) {
                                //UserPermission.create({
                                //    organization: org._id,
                                //    permission: [{operation: '*', allow: true}]
                                //}, function (err, userPermission) {
                                //    if (err) return console.log(err);
                                    var newProgram = {
                                        name: org.name
                                    };
                                    var userPermission = { organization: org._id, permission: [ new Permission({operation: '*', allow: true}) ]};
                                    Program.create(newProgram, function (err, program) {
                                        if(err) return console.log(err);
                                        if(userPermission) {
                                            User.findOneAndUpdate({email: user.email}, { $set: { permissions:[userPermission] } }, { upsert: true }, function (err, usr) {
                                                if (err) return console.log(err);
                                                console.log('Success!');
                                            });
                                        }
                                    });

                                //});
                            }
                        });
                    };

                    var name = rs.contact.split(" ");

                    var newUser = {
                        email: rs.email,
                        first_name: '',
                        middle_name: '',
                        last_name: '',
                        password: 'demo',
                        username: rs.username
                    };

                    if(name.length > 2){
                        newUser.first_name = name[0];
                        newUser.middle_name = name[1];
                        var lastNames = [];
                        for(var n = 2; n < name.length; n++){
                            lastNames.push(name[n]);
                        }
                        newUser.last_name = lastNames.join(" ");
                    } else {
                        newUser.first_name = name[0];
                        newUser.last_name = name[1];
                    }

                    User.findOneAndUpdate({email: rs.email}, { $set: newUser }, { upsert: true }, function (err, user) {
                        if(err) return console.log(err);
                        createOrg(err, user);
                    });
                })
                .on("end", function(){
                    done();
                });

            stream.pipe(csvStream);


        });
    }
};
module.exports = populateCbo;
'use strict';
/**
 * Created by zaenal on 20/05/15.
 */
// Load required packages
var mongoose = require('mongoose');
var Address = require('./schema/Address');
var Student = require('./Student');
var Program = require('./Program');
var utils = require('../../lib/utils');
var config = utils.config();
var xsreConfig = config.get('hzb').xsre;
var _ = require('underscore');
var xmlParser = require('js2xmlparser');
var moment = require('moment');
var ObjectId = mongoose.Types.ObjectId;

// Define our Organization schema
var OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    url: { type: String, required: true }, // The unique URL where the site lives
    website: { type: String }, // The CBO Main Website, not related with the app
    description: { type: String },
    addresses: [ Address ],
    externalServiceId: { type: Number, required: true },
    personnelId: { type: Number },
    authorizedEntityId: { type: Number, required: true },
    created: { type: Date, required: true, default: Date.now },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    last_updated: { type: Date, required: true, default: Date.now },
    last_updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});


OrganizationSchema.statics.crit = function(values, exclude){
    exclude = exclude || [];
    var criteria = {};
    /**
     * Find match
     */
    [
        '_id', 'name', 'url', 'website', 'description',
        'externalServiceId', 'personnelId', 'authorizedEntityId'
    ].forEach(function(iterator){

        if(iterator in values && exclude.indexOf(iterator) === -1){

            if(iterator === 'name') {

                values[iterator] = new RegExp(values[iterator], 'i');

            }

            criteria[iterator] = values[iterator];

        }
    });

    return criteria;

};



OrganizationSchema.virtual('Id')
.get(function(){
    return this.id;
});

/**
 *
 * @param user
 * @param crit
 * @param done
 */
OrganizationSchema.statics.findByUser = function(user, crit, done){
    crit = crit || {};
    if(user.permissions.length > 0){
        var _id = [];
        user.permissions.forEach(function(organization){
            _id.push(organization.organization);
        });
        /**
         * If has permission
         * Filter here
         */
        crit._id = { $in: _id };
    }
    this.find(crit, done);
};
/**
 *
 * @param user
 * @param orgId
 * @param stdId
 * @param callback
 */
OrganizationSchema.statics.pushStudent = function(user, orgId, stdId, callback){

    this.findOne({ _id: ObjectId(orgId) }, function(err, organization) {

        if (err) { return callback(err); }

        if (!organization) {
            return callback('Data not found');
        }

        var cb = function (err, student) {

            if (err) { return callback(err); }

            if (!student) {
                return callback('Data not found');
            }

            var CBOStudent = {
                '@': {
                    id: student._id.toString()
                },
                organization: {
                    '@': {
                        refId: student.organization.toString()
                    },
                    organizationName: organization.name,
                    externalServiceId: organization.externalServiceId,
                    personnelId: organization.personnelId,
                    authorizedEntityId: organization.authorizedEntityId,
                    districtStudentId: student.district_student_id,
                    zoneId: student.school_district,
                    contextId: xsreConfig.contextId
                },

                studentActivity: [],

                programs: {
                    activities: {
                        activity: []
                    }
                }

            };

            var programsId = {};

            var programId = [];

            _.each(student.programs, function(program){

                if(Object.keys(programsId).indexOf(program.program.toString()) === -1) {
                    programsId[program.program.toString()] = [];
                }

                programsId[program.program.toString()].push(program.toObject());

                programId.push(program.program);

                CBOStudent.programs.activities.activity.push({
                    studentActivityRefId: program.program.toString(),
                    startDate: moment(new Date(program.participation_start_date)).format('MM/DD/YYYY'),
                    endDate:moment(new Date(program.participation_end_date)).format('MM/DD/YYYY'),
                    active: program.active,
                    tags: {
                        tag: program.cohort
                    }

                });

            });

            if(!_.isEmpty(programsId)){

                Program.find({ _id: { $in: programId } }, function(err, programs){

                    if(err) {
                        return callback(err);
                    }

                    _.each(programs, function(program){

                        if(program._id.toString() in programsId){

                            programsId[program._id.toString()].forEach(function(prgm){

                                CBOStudent.studentActivity.push({
                                    '@': {
                                        refId: program._id.toString()
                                    },
                                    title: program.name
                                });

                            });

                        }

                    });

                    callback(null, xmlParser('CBOStudent', CBOStudent, {
                        declaration: {
                            encoding: 'utf-16'
                        }
                    }));

                });


            } else {

                callback(null, xmlParser('CBOStudent', CBOStudent, {
                    declaration: {
                        encoding: 'utf-16'
                    }
                }));
            }

        };

        if(user){
            Student.protect(user.role, { students: stdId, value: stdId }, user).findOne({
                _id: ObjectId(stdId),
                organization: ObjectId(orgId)
            }, cb);
        } else {
            Student.findOne({
                _id: ObjectId(stdId),
                organization: ObjectId(orgId)
            }, cb);
        }

    });
};

// Export the Mongoose model
module.exports = mongoose.model('Organization', OrganizationSchema);
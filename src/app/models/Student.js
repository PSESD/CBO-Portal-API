/**
 * Created by zaenal on 20/05/15.
 */
// Load required packages
var mongoose = require('mongoose');
var StudentProgram = require('./StudentProgram');
var Address = require('./Address');

// Define our Student schema
var StudentSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    first_name: { type: String },
    last_name: { type: String, required: true, index: true },
    middle_name: { type: String },
    student_id: { type: String },
    addresses: [ Address ],
    school_district: { type: String },
    programs: [ StudentProgram ],
    created: { type: Date, required: true, default: Date.now },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    last_updated: { type: Date, required: true, default: Date.now },
    last_updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Export the Mongoose model
module.exports = mongoose.model('Student', StudentSchema);
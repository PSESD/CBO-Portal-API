/**
 * Created by zaenal on 20/05/15.
 */
// Load required packages
var mongoose = require('mongoose');
var Address = require('./schema/Address');

// Define our Organization schema
var OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    url: { type: String, required: true }, // The unique URL where the site lives
    website: { type: String }, // The CBO Main Website, not related with the app
    description: { type: String },
    addresses: [ Address ],
    created: { type: Date, required: true, default: Date.now },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    last_updated: { type: Date, required: true, default: Date.now },
    last_updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
OrganizationSchema.virtual('Id')
.get(function(){
    return this.id;
});


// Export the Mongoose model
module.exports = mongoose.model('Organization', OrganizationSchema);
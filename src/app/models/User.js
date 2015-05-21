// Load required packages
var mongoose = require('mongoose');
var crypto = require('crypto');
var UserPermission = require('./UserPermission');

// Define our user schema
var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  /**
   * Store salt as plain text
   */
  salt: {
    type: String
  },
  first_name: { type: String, trim: true },
  middle_name: { type: String, trim: true },
  last_name: { type: String, trim: true, required: true },
  email: { type: String, trim: true, unique: true, index: true, minlength: 6 },
  permissions: [ UserPermission ], // Store a permission a user has, by each organization.
  created: {
    type: Date,
    default: Date.now
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  last_updated: { type: Date, required: true, default: Date.now },
  last_updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

UserSchema.virtual('userId')
    .get(function(){
      return this.id;
    });
/**
 *
 * @param password
 * @returns {*}
 */
UserSchema.methods.encryptPassword = function(password){
  return crypto.pbkdf2Sync(password, this.salt, 4096, 512, 'sha256').toString('hex');
};
/**
 *
 */
UserSchema.virtual('password')
    .set(function(password) {
      this._plainPassword = password;
      this.salt = crypto.randomBytes(128).toString('base64');
      this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() { return this._plainPassword; });
/**
 *
 * @param password
 * @param cb
 */
UserSchema.methods.verifyPassword = function(password, cb) {
  cb(null, this.encryptPassword(password) === this.hashedPassword);
};

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);

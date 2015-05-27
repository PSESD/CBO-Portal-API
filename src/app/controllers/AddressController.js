/**
 * Created by zaenal on 21/05/15.
 */
var model = require('../models/Address');
var Model = require('../../lib/model');
var objModel = new Model(model);
var AddressController = objModel.crud();

module.exports = AddressController;
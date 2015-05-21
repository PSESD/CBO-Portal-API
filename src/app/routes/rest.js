

function Rest(router, Api) {
    var self = this;
    self.handleRoutes(router, Api);
}
/**
 * Handle Route from Request
 * @param router
 * @param Api
 */
Rest.prototype.handleRoutes= function(router, Api) {
	var indexController = Api.controller('Index');
	var addressController = Api.controller('AddressController');
	var authController = Api.controller('Auth');

	router.get('/', indexController.index);
	// Create endpoint handlers for /
	//router
	//  .get('/address/all', addressController.all)
	//  .post('/address', addressController.create)
	//  .put('/address/:id', addressController.save)
	//  .delete('/address/:id', addressController.delete);



};

module.exports = Rest;
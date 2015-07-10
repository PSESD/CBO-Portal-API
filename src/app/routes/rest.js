

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
    var userCtr = Api.controller('UserController');

	var organizationCtr = Api.controller('OrganizationController');

	var studentCtr = Api.controller('StudentController');
	var tagCtr = Api.controller('TagController');
	var indexCtr = Api.controller('Index');
    var studentProgramCtr = Api.controller('StudentProgramController');
    var prsCtr = Api.controller('PRSController');
	var auth = Api.controller('Auth');

	router.get('/', indexCtr.index);
	router.get('/heartbeat', function(req, res) {
        res.send('OK');
    });

    router.get('/users/cleanup', userCtr.cleanAll);


	router.route('/user')
		.get(auth.isBearerAuthenticated, userCtr.get)
        .put(auth.isBearerAuthenticated, userCtr.save)
        .post(auth.isBearerAuthenticated, userCtr.create)
        .delete(auth.isBearerAuthenticated, userCtr.deleteByEmail)
    ;

    router.route('/user/role')
        .put(auth.isBearerAuthenticated, userCtr.setRole)
        .get(auth.isBearerAuthenticated, userCtr.getRole)
    ;



    router.route('/organizations')
        .post(auth.isBearerAuthenticated, organizationCtr.create)
        .get(auth.isBearerAuthenticated, organizationCtr.get);

    router.route('/:organizationId').get(auth.isBearerAuthenticated, organizationCtr.find);

    router.route('/:organizationId/profile')
        .get(auth.isBearerAuthenticated, organizationCtr.profile)
        .put(auth.isBearerAuthenticated, organizationCtr.updateProfile);

    router.route('/:organizationId/users')
        .post(auth.isBearerAuthenticated, organizationCtr.postUser)
        .get(auth.isBearerAuthenticated, organizationCtr.allUsers);

    router.route('/:organizationId/users/:userId')
        .put(auth.isBearerAuthenticated, organizationCtr.putUser)
        .get(auth.isBearerAuthenticated, organizationCtr.getUser)
        .delete(auth.isBearerAuthenticated, organizationCtr.deleteUser)
    ;

    router.route('/:organizationId/programs')
        .get(auth.isBearerAuthenticated, organizationCtr.allProgram)
        .post(auth.isBearerAuthenticated, organizationCtr.postProgram);

    router.route('/:organizationId/programs/:programId')
        .get(auth.isBearerAuthenticated, organizationCtr.getProgram)
        .put(auth.isBearerAuthenticated, organizationCtr.putProgram)
        .delete(auth.isBearerAuthenticated, organizationCtr.deleteProgram)
    ;

    router.route('/:organizationId/students')
          .post(auth.isBearerAuthenticated, studentCtr.createByOrgId)
          .get(auth.isBearerAuthenticated, studentCtr.getStudents);


    router.route('/:organizationId/students/not-assign')
        .get(auth.isBearerAuthenticated, studentCtr.getStudentNotAssigns);

    router.route('/:organizationId/students/:studentId')
        .get(auth.isBearerAuthenticated, studentCtr.getStudentById)
        .put(auth.isBearerAuthenticated, studentCtr.putStudentById)
        .delete(auth.isBearerAuthenticated, studentCtr.deleteStudentById);

    router.route('/:organizationId/users/:userId/students')
        .get(auth.isBearerAuthenticated, studentCtr.getByUserId)
        .post(auth.isBearerAuthenticated, studentCtr.postByUserId)
    ;

    router.route('/:organizationId/users/:userId/students/:studentId')
        .get(auth.isBearerAuthenticated, studentCtr.getStudentUserById)
        .put(auth.isBearerAuthenticated, studentCtr.putStudentUserById)
        .delete(auth.isBearerAuthenticated, studentCtr.deleteStudentUserById)
    ;
    /**
     * Tag route
     */
    router.route('/:organizationId/tags')
        .post(auth.isBearerAuthenticated, tagCtr.createByOrgId)
        .get(auth.isBearerAuthenticated, tagCtr.getTags);

    router.route('/:organizationId/tags/:tagId')
        .get(auth.isBearerAuthenticated, tagCtr.getTagById)
        .put(auth.isBearerAuthenticated, tagCtr.putTagById)
        .delete(auth.isBearerAuthenticated, tagCtr.deleteTagById);

    router.route('/:organizationId/students/:studentId/xsre').get(auth.isBearerAuthenticated, studentCtr.getStudentsBackpack);


    router.route('/:organizationId/students/:studentId/programs')
        .get(auth.isBearerAuthenticated, studentProgramCtr.getByStudentId)
        .post(auth.isBearerAuthenticated, studentProgramCtr.addByStudentId)
    ;

    router.route('/:organizationId/programs/:programId/students')
        .get(auth.isBearerAuthenticated, studentProgramCtr.getByProgramId)
        .post(auth.isBearerAuthenticated, studentProgramCtr.addByProgramId)
    ;

    router.route('/:organizationId/programs/:programId/students/:studentId')
        .get(auth.isBearerAuthenticated, studentProgramCtr.getStudentById)
        .put(auth.isBearerAuthenticated, studentProgramCtr.putStudentById)
        .delete(auth.isBearerAuthenticated, studentProgramCtr.deleteStudentById)
    ;

    router.route('/:organizationId/xsre/districts').get(auth.isBearerAuthenticated, prsCtr.getDistricts);

    /**
     * Only for development
     */
    if(Api.env !== 'production') {
        router.get('/:organizationId/students/:studentId/xsre-skip', studentCtr.getStudentsBackpack);
        router.get('/dummy/test', Api.controller('DummyController').index);
    }



};

module.exports = Rest;
'use strict';
/**
 *
 * @param router
 * @param Api
 * @constructor
 */
function Rest(router, Api){

    this.router = router;

    this.Api = Api;

    this.format = '.:format?';
    /**
     * Defined Controller
     */
    this.userController = this.Api.controller('UserController');

    this.organizationController = this.Api.controller('OrganizationController');

    this.studentController = this.Api.controller('StudentController');

    this.tagController = this.Api.controller('TagController');

    this.indexController = this.Api.controller('IndexController');

    this.studentProgramController = this.Api.controller('StudentProgramController');

    this.applicationController = this.Api.controller('ApplicationController');

    this.reportController = this.Api.controller('ReportController');

    this.auth = this.Api.middleware('Auth');

    this.handleRoutes();
}

/**
 *
 */
Rest.prototype.handleRoutes = function(){

    this.routeHome();

    this.routeUser();

    this.routeOrganization();

    this.routeOrganizationUser();

    this.routeOrganizationProgram();

    this.routeOrganizationStudent();

    this.routeOrganizationUserStudent();

    this.routeStudentProgram();

    this.routeProgramStudent();

    this.routeTag();

    this.routeTest();

    this.routeReport();

    this.routeApplication();

};

/**
 *
 */
Rest.prototype.routeHome = function(){

    this.router.get('/' + this.format, this.indexController.index);

    this.router.route('/rollbar' + this.format)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.indexController.rollbar)
    ;

    this.router.get('/heartbeat' + this.format, function(req, res){
        res.sendSuccess('OK');
    });

};
/**
 *
 */
Rest.prototype.routeUser = function(){

    this.router.route('/user' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.userController.get)
        .put(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.userController.save)
    ;
};
/**
 *
 */
Rest.prototype.routeOrganization = function(){

    this.router.route('/organizations' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.get);

    this.router.route('/:organizationId' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.find);

    this.router.route('/:organizationId/profile' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.profile)
        .put(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.organizationController.updateProfile);

};
/**
 *
 */
Rest.prototype.routeOrganizationUser = function(){

    this.router.route('/:organizationId/users' + this.format)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.organizationController.postUser)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.allUsers);

    this.router.route('/:organizationId/users/:userId' + this.format)
        .put(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.organizationController.putUser)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.organizationController.getUser)
        .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.organizationController.deleteUser)
    ;
    this.router.route('/:organizationId/pending/users' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.pending);
};
/**
 *
 */
Rest.prototype.routeOrganizationProgram = function(){

    this.router.route('/:organizationId/programs' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.allProgram)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.postProgram);

    this.router.route('/:organizationId/programs/:programId' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.getProgram)
        .put(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.putProgram)
        .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.organizationController.deleteProgram)
    ;
};
/**
 *
 */
Rest.prototype.routeOrganizationStudent = function(){
    this.router.route('/:organizationId/students' + this.format)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentController.createByOrgId)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentController.getStudents);

    this.router.route('/:organizationId/students/:studentId' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentController.getStudentById)
        .put(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentController.putStudentById)
        .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentController.deleteStudentById);


    this.router.route('/:organizationId/students/:studentId/xsre' + this.format)
        .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentController.deleteCacheStudentsBackpack);
    //.get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentController.getStudentsBackpack);

    function separateFilter (req, res, next){
        var separate = req.params.separate;
        var whiteList = [ 'general', 'xsre', 'report', 'attendance', 'transcript', 'assessment' ];
        if(whiteList.indexOf(separate) === -1){
            return next(new Error('Hacking attemp!!'));
        }
        return next();
    }

    this.router.route('/:organizationId/students/:studentId/:separate' + this.format)
        .get(separateFilter, this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentController.getStudentsBackpack);

};
/**
 *
 */
Rest.prototype.routeOrganizationUserStudent = function(){
    this.router.route('/:organizationId/users/:userId/students' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.userController.getByUserId)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.userController.postByUserId)
    ;

    this.router.route('/:organizationId/users/:userId/students/:studentId' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.userController.getStudentUserById)
        .put(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.userController.putStudentUserById)
        .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.userController.deleteStudentUserById)
    ;

};
/**
 *
 */
Rest.prototype.routeStudentProgram = function(){

    this.router.route('/:organizationId/students/:studentId/programs' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentProgramController.getByStudentId)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentProgramController.addByStudentId)
    ;

    this.router.route('/:organizationId/students/:studentId/programs/CBOStudent.xml')
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentProgramController.getByStudentIdXsre)
    ;
};
/**
 *
 */
Rest.prototype.routeProgramStudent = function(){

    this.router.route('/:organizationId/programs/:programId/students' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentProgramController.getByProgramId)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentProgramController.addByProgramId)
    ;

    this.router.route('/:organizationId/programs/:programId/students/:studentId' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentProgramController.getStudentById)
        .put(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentProgramController.putStudentById)
        .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.studentProgramController.deleteStudentById)
    ;


};
/**
 *
 */
Rest.prototype.routeTag = function(){
    /**
     * Tag route
     */
    this.router.route('/:organizationId/tags' + this.format)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.tagController.createByOrgId)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.tagController.getTags);

    this.router.route('/:organizationId/tags/:tagId' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.tagController.getTagById)
        .put(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.tagController.putTagById)
        .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.tagController.deleteTagById);

};
/**
 * Only for development
 */
Rest.prototype.routeTest = function(){

    if(this.Api.env !== 'production'){
        this.router.get('/:organizationId/students/:studentId/xsre-skip' + this.format, this.studentController.getStudentsBackpack);
        this.router.get('/dummy/test' + this.format, this.Api.controller('DummyController').index);
        this.router.get('/users/cleanup' + this.format, this.userController.cleanAll);
        this.router.route('/organizations' + this.format).post(this.auth.isBearerAuthenticated, this.auth.isAdmin, this.organizationController.create);
        this.router.route('/user' + this.format)
            .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.userController.create)
            .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.userController.deleteByEmail)
        ;
    }
};

Rest.prototype.routeReport = function(){

    this.router.route('/:organizationId/reports/students/:by' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.reportController.getStudentBy)
    ;
    this.router.route('/:organizationId/reports/student-filters' + this.format)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.reportController.getFilters)
    ;

};

Rest.prototype.routeApplication = function(){

    this.router.route('/:organizationId/applications' + this.format)
        .post(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.applicationController.post)
        .get(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.applicationController.get)
    ;
    this.router.route('/:organizationId/applications/:applicationId' + this.format)
        .delete(this.auth.isBearerAuthenticated, this.auth.hasAccess, this.auth.isAdmin, this.applicationController.delete)
    ;

};

module.exports = Rest;

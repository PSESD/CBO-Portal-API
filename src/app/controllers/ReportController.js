/**
 * Created by zaenal on 19/01/16.
 */
'use strict';
/**
 * Created by zaenal on 21/05/15.
 */
var utils = require('../../lib/utils');
var config = utils.config();
var con = require('../../lib/sql');
var _ = require('underscore');
var ReportController = {};
/**
 * Get the list of all organizations that this user have access to in our system.
 * @param req
 * @param res
 * @returns {*}
 */
ReportController.getStudentBy = function (req, res) {
    var by = req.params.by;
    var orgId = req.params.organizationId;
    var filters = {
        program: req.query.program,
        district: req.query.district,
        cohort: req.query.cohort,
        caseload: req.query.caseload
    };
    var sql = null;
    var group = null;
    var params = [ orgId ];
    var innerWhere = [];

    switch(by){
        case 'school_district':
            sql = 'SELECT IF(s.school = "" OR s.school IS NULL, "N/A", s.school) as schoolName, s.school_district as schoolDistrict ';
            sql += 'FROM students s ';
            sql += 'WHERE s.id = ? ';
            group = 'schoolName, schoolDistrict';
            break;
        case 'grade':
            sql = 'SELECT IF(s.grade_level IS NULL, "N/A", s.grade_level) as gradeLevel ';
            sql += 'FROM students s ';
            sql += 'WHERE s.id = ? ';
            group = 'gradeLevel';
            break;
        case 'gender':
            sql = 'SELECT IF(s.gender = "" OR s.gender IS NULL,  "N/A", s.gender) as genderName ';
            sql += 'FROM students s ';
            sql += 'WHERE s.id = ? ';
            group = 'genderName';
            break;
        case 'race':
            sql = 'SELECT IF(s.ethnicity = "" OR s.ethnicity IS NULL, "N/A", s.ethnicity) as ethnicityName ';
            sql += 'FROM students s ';
            sql += 'WHERE s.id = ? ';
            group = 'ethnicityName';
            break;
        default:
            return res.sendError(res.__('request_not_valid'));
    }
    var iwhere = null;
    var innerParams = [];
    if(sql !== null){
        if(filters.program){
            //sql += ' AND sp.program_name';
            iwhere = 'sp.program_name';
            if(_.isArray(filters.program)){
                iwhere += ' IN( ? )';
            } else {
                iwhere += ' = ?';
            }
            innerParams.push(filters.program);
            innerWhere.push(iwhere);

        }
        if(filters.district){
            sql += ' AND s.school_district';
            if(_.isArray(filters.district)){
                sql += ' IN( ? )';
            } else {
                sql += ' = ?';
            }
            params.push(filters.district);
        }
        if(filters.cohort){
            if(_.isArray(filters.cohort)){
                var orWhere = [];
                filters.cohort.forEach(function(c){
                    orWhere.push('FIND_IN_SET(?, sp.cohorts) > 0');
                    innerParams.push(c);
                });
                if(orWhere.length > 0){
                    innerWhere.push(' (' + orWhere.join(' OR ') + ')');
                }
            } else {
                innerWhere.push('FIND_IN_SET(?, sp.cohorts) > 0');
                innerParams.push(filters.cohort);
            }
        }

        if(innerWhere.length > 0){
            sql += con.format(' AND s.student_id IN(SELECT sp.student_id FROM student_programs sp WHERE ' + innerWhere.join(' AND ') + ')', innerParams);
        }
        if(group){
            sql = 'SELECT *, COUNT(*) as total FROM (' + sql + ') as t GROUP BY ' + group;
        }
        console.log(con.format(sql,params));
        con.query(sql, params, function(err, results){
            if(err){
                return res.sendError(err);
            }
            res.sendSuccess(results);
        });
    }

};

ReportController.getFilters = function(req, res){
    var orgId = req.params.organizationId;
    var sql = 'SELECT * ';
    sql += 'FROM students s ';
    sql += 'LEFT JOIN student_programs sp ON s.student_id = sp.student_id ';
    sql += 'WHERE s.id = ? ';

    con.query(sql, [ orgId ], function(err, rows){

        var rowsets = {
          programs: [],
          districts: [],
          cohorts: [],
          caseload: []
        };

        if(err){
            return res.sendError(err);
        }

        rows.forEach(function(row){
            if(row.program_name && rowsets.programs.indexOf(row.program_name) === -1){
                rowsets.programs.push(row.program_name);
            }
            if(row.cohorts){
                row.cohorts.split(',').forEach(function(cohort){
                    if(!_.isObject(cohort)){
                        if(cohort && rowsets.cohorts.indexOf(cohort) === -1){
                            rowsets.cohorts.push(('' + cohort).replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1){
                                return $1.toUpperCase();
                            }));
                        }
                    }
                });
            }
            if(row.school_district && rowsets.districts.indexOf(row.school_district) === -1){
                rowsets.districts.push(row.school_district);
            }
        });

        rowsets.cohorts = _.uniq(rowsets.cohorts);

        res.sendSuccess(rowsets);

    });
};

/**
 *
 * @type {{_checkPermission, grant, create, save, get, all, delete}|{create: Function, save: Function, get: Function, all: Function, delete: Function}}
 */
module.exports = ReportController;
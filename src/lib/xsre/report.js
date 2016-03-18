'use strict';
/**
 * Created by zaenal on 21/08/15.
 */
var moment = require('moment');
var _ = require('underscore');

/**
 *
 * @param xsre
 * @constructor
 */
function Report(xsre){
    this.allDates = [];
    this.filterStart = xsre.params.from || null;
    this.filterTo = xsre.params.to || null;
    this.from = null;
    this.to = null;

    if(this.filterStart){
        this.from = this.dateTime(this.filterStart);
    }

    if(this.filterTo){
        this.to = this.dateTime(this.filterTo);
    }

    //this.notAvailable = 'N/A';
    this.notAvailable = '';

    this.facets = xsre.facets;
    this.attendances = xsre.json.attendance || null;

}
/**
 *
 * @param dateTime
 * @returns {*}
 */
Report.prototype.dateTime = function(dateTime){
    if(!dateTime) {
        return null;
    }

    return moment(new Date(dateTime));
};

/**
 *
 * @returns {{attendance: number, behavior: number}|*}
 */
Report.prototype.attendance = function(){

    var me = this;

    var mm = null;

    var attendance = [];

    var attendances = {};

    var months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    if(_.isObject(me.attendances) && _.isObject(me.attendances.events) && !_.isUndefined(me.attendances.events.event)){

        if(!_.isArray(me.attendances.events.event)){

            me.attendances.events.event = [me.attendances.events.event];

        }

        me.attendances.events.event.forEach(function(event){

            mm = moment(new Date(event.calendarEventDate));

            event.calendarEventDateTime = mm.valueOf();

            var passed = true;

            if(me.from){

                if(me.to){
                    passed = (event.calendarEventDateTime >= me.from.valueOf() && event.calendarEventDateTime <= me.to.valueOf());
                } else {
                    passed = mm.format('MM-DD-YYYY') === me.from.format('MM-DD-YYYY');
                }

            }

            if(passed && mm.isValid()){

                if('dailyAttendanceStatus' in event){

                    event.attendanceStatus = event.dailyAttendanceStatus;

                }

                if(me.allDates.indexOf(event.calendarEventDate) === -1) {
                    me.allDates.push(event.calendarEventDateTime);
                }

                if(!(mm.format('MMMM YYYY') in attendances)){
                    attendances[mm.format('MMMM YYYY')] = 0;
                }

                if('attendanceEventType' in event && event.attendanceEventType === 'DailyAttendance'){

                    var attendanceStatus = me.slug(event.attendanceStatus);

                    if(attendanceStatus === 'excused' || attendanceStatus === 'unexcused'){

                        attendances[mm.format('MMMM YYYY')]++;

                    }

                }

            }

        });

        var start = moment(_.min(me.allDates));

        var end = moment(_.max(me.allDates));

        var endYear = parseInt(end.format('YYYY'));
        var endMonth = end.format('MMMM');
        var startYear = parseInt(start.format('YYYY'));
        var startMonth = start.format('MMMM');

        console.log(startYear, endYear);

        for(var d = startYear; d <= endYear; d++){
            var index = 0;
            var ended = months.length;
            if(d === startYear){
                index = months.indexOf(startMonth);
            }
            if(d === endYear){
                ended = months.indexOf(endMonth) + 1;
            }
            for(var m = index; m < ended; m++){
                console.log(months[m] + ' ' + d, ' => ', index, ':', ended, ' ~> ', d, ':', endYear, ' >> ', d === endYear);
                var key = months[m] + ' ' + d;
                var val = 0;
                if(key in attendances){
                    val = attendances[key];
                }
                attendance.push({ x: key, y: val });
            }
        }
    }

    return attendance;

};

Report.prototype.slug = function(value){

    if(!value) {
        return '';
    }

    return (value+'').toLowerCase().replace('absence', '');
};
/**
 *
 * @returns {{attendance: *, programs: Array}}
 */
Report.prototype.serialize = function(){
  return {
      attendance: this.attendance(),
      programs: []
  };
};
/**
 *
 * @param message
 */
Report.prototype.print = function(message){

    console.log(require('prettyjson').render(message));

};

/**
 *
 * @type {Attendance}
 */
module.exports = Report;
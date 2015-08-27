/**
 * Created by zaenal on 21/08/15.
 */
var Attendance = require(__dirname+'/../lib/attendance');
var xmlFile = __dirname + '/xsre.xml';
var fs = require('fs');
var parseString = require('xml2js').parseString;
var body = fs.readFileSync(xmlFile);

parseString(body, { explicitArray: false }, function (err, result) {

    var json = (result && 'error' in result) ? result.error.message : console.log(result.error);

    console.log(result, json);
    //res.errJson(json);

});

var data = {
    "_links": {"self": {"href": "/55913fc817aac10c2bbfe1e8/students/55d3e759d099940e006d7206/xsre"}},
    "_embedded": {
        "users": [{
            "_links": {"self": {"href": "/55913fc817aac10c2bbfe1e8/users/55913fc906d86a0c0077fbc6"}},
            "id": "55913fc906d86a0c0077fbc6",
            "email": "demo@upwardstech.com",
            "fullname": "User CBO Demo"
        }],
        "programs": [{
            "program": "5592d25c23ab6a4800d0e94f",
            "participation_start_date": "2015-08-20T00:00:00.000Z",
            "participation_end_date": "2015-08-21T00:00:00.000Z",
            "creator": "55913fc906d86a0c0077fbc6",
            "last_updated_by": "55913fc906d86a0c0077fbc6",
            "_id": "55d5aca39529100d00a39565",
            "last_updated": "2015-08-20T10:32:03.029Z",
            "created": "2015-08-20T10:32:03.029Z",
            "cohort": [],
            "active": true,
            "program_name": "After-school Tutoring"
        }]
    },
    "name": {"familyName": "Marvin", "givenName": "Peyton"},
    "localId": "Sample6",
    "demographics": {"races": {"race": {"race": "HispanicLatino"}}, "sex": "Female", "birthDate": "1998-01-30"},
    "disciplineIncidents": {
        "disciplineIncident": [
            {
                "incidentCategory": 04645,
                "description": "Mutual participation in an incident involving physical violence, where there is no injury to any person requiring professional medical attention.",
                "incidentDate": "2014-11-11",
                "actions": []
            },
            {
                "incidentCategory": 04651,
                "description": "Mutual participation in an incident involving physical violence, where there is no injury to any person requiring professional medical attention.",
                "incidentDate": "2014-11-11",
                "actions": []
            }
        ]
    },
    "attendance": {
        "summaries": {
            "summary": [{
                "startDate": {"_": "10/27/2014", "$": {"xsi:type": "xsd:string"}},
                "daysInAttendance": "53.00",
                "daysAbsent": "9"
            }]
        },
        "events": {
            "event": [
             {
                "school": {
                    "stateProvinceId": "37501",
                    "otherIds": {"otherId": {"type": "NCES", "id": "02693"}},
                    "schoolName": "Squalicum High School",
                    "phoneNumber": {"phoneNumberType": "Work", "number": "3606766471", "primaryIndicator": "true"}
                },
                "calendarEventDate": "11/11/2014",
                "dailyAttendanceStatus": "UnexcusedAbsence",
                "attendanceEventType": "ClassSectionAttendance",
                "absentAttendanceCategory": "13297",
                "attendanceValue": 0.1,
                "timeTablePeriod": 1
            },
            {
                "school": {
                    "stateProvinceId": "37501",
                    "otherIds": {"otherId": {"type": "NCES", "id": "02693"}},
                    "schoolName": "Squalicum High School",
                    "phoneNumber": {"phoneNumberType": "Work", "number": "3606766471", "primaryIndicator": "true"}
                },
                "calendarEventDate": "11/11/2014",
                "dailyAttendanceStatus": "Present",
                "attendanceEventType": "ClassSectionAttendance",
                "absentAttendanceCategory": "13297",
                "attendanceValue": 0.2,
                "timeTablePeriod": 2
            },
            {
                "school": {
                    "stateProvinceId": "37501",
                    "otherIds": {"otherId": {"type": "NCES", "id": "02693"}},
                    "schoolName": "Squalicum High School",
                    "phoneNumber": {"phoneNumberType": "Work", "number": "3606766471", "primaryIndicator": "true"}
                },
                "calendarEventDate": "11/11/2014",
                "dailyAttendanceStatus": "ExcusedAbsence",
                "attendanceEventType": "ClassSectionAttendance",
                "absentAttendanceCategory": "13297",
                "attendanceValue": 0.3,
                "timeTablePeriod": 3
            },
            {
                "school": {
                    "stateProvinceId": "37501",
                    "otherIds": {"otherId": {"type": "NCES", "id": "02693"}},
                    "schoolName": "Squalicum High School",
                    "phoneNumber": {"phoneNumberType": "Work", "number": "3606766471", "primaryIndicator": "true"}
                },
                "calendarEventDate": "11/11/2014",
                "dailyAttendanceStatus": "Tardy",
                "attendanceEventType": "ClassSectionAttendance",
                "absentAttendanceCategory": "13297",
                "attendanceValue": 0.4
            },
            {
                "school": {
                    "stateProvinceId": "37501",
                    "otherIds": {"otherId": {"type": "NCES", "id": "02693"}},
                    "schoolName": "Squalicum High School",
                    "phoneNumber": {"phoneNumberType": "Work", "number": "3606766471", "primaryIndicator": "true"}
                },
                "calendarEventDate": "11/11/2014",
                "dailyAttendanceStatus": "EarlyDeparture",
                "attendanceEventType": "ClassSectionAttendance",
                "absentAttendanceCategory": "13297",
                "attendanceValue": 0.5
            },
            {
                "school": {
                    "stateProvinceId": "37501",
                    "otherIds": {"otherId": {"type": "NCES", "id": "02693"}},
                    "schoolName": "Squalicum High School",
                    "phoneNumber": {"phoneNumberType": "Work", "number": "3606766471", "primaryIndicator": "true"}
                },
                "calendarEventDate": "11/20/2014",
                "dailyAttendanceStatus": "ExcusedAbsence",
                "attendanceEventType": "DailyAttendance",
                "presentAttendanceCategory": "13290",
                "attendanceValue": 0.5
            }, {
                "school": {
                    "stateProvinceId": "37501",
                    "otherIds": {"otherId": {"type": "NCES", "id": "02693"}},
                    "schoolName": "Squalicum High School",
                    "phoneNumber": {"phoneNumberType": "Work", "number": "3606766471", "primaryIndicator": "true"}
                },
                "calendarEventDate": "11/21/2014",
                "dailyAttendanceStatus": "ExcusedAbsence",
                "attendanceEventType": "DailyAttendance",
                "absentAttendanceCategory": "13297",
                "attendanceValue": 0.9
            }
            ]
        }
    }
};

console.log(require('prettyjson').render(new Attendance(data).getAttendances()));
//new Attendance(data).getAttendances();
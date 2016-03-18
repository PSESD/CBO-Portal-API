
# Secure Data Portal for community-based organizations (CBO's) [![Code Climate](https://codeclimate.com/repos/565eb21ba7512d6fbb002873/badges/7f33b5f9c16306a725fd/gpa.svg)](https://codeclimate.com/repos/565eb21ba7512d6fbb002873/feed) [![Test Coverage](https://codeclimate.com/repos/565eb21ba7512d6fbb002873/badges/7f33b5f9c16306a725fd/coverage.svg)](https://codeclimate.com/repos/565eb21ba7512d6fbb002873/coverage) [![Issue Count](https://codeclimate.com/repos/565eb21ba7512d6fbb002873/badges/7f33b5f9c16306a725fd/issue_count.svg)](https://codeclimate.com/repos/565eb21ba7512d6fbb002873/feed)

## Overview
The authorization sequence begins when your application redirects a browser to a CBO api URL; the URL includes query parameters that indicate the type of access being requested. As in other scenarios, CBO api server handles user authentication, session selection, and user consent. The result is an authorization code, which api returns to your application in a query string.

After receiving the authorization code, your application can exchange the code (along with a client ID and client secret) for an access token and, in some cases, a refresh token.

Node.js client library for [Oauth2](http://oauth.net/2/).

The URL used when authenticating a user is`http://<domain>:<port>/api/oauth2/authorize`.

## Requirements

You need to have installed Node.js and MongoDB

Another Tools:
#####- Mandrill [link](https://mandrillapp.com) 
Email  service for send mail. Below example in config file: 

    
      "mandrill": {
            "api_key": "<api_key>"
        }

#####- Rollbar [link](https://rollbar.com) 
Logger service. The application need token. Below example in config file: 
   
      "rollbar": {
            "access_token": "<rollbar_token>"
        }

#####- Redis [link](http://redis.io) 
Cache adapter. Below example in config file: 
   
      "cache": {
            "adapter": "memory",
            "backup": "redis",
            "redis": {
                "host": "localhost",
                "port": "6379",
                "db": 0,
                "ttl": 86400
            },
            "memory": {
                "max": 100,
                "ttl": 60
            }
        }



## Installation


To install dependencies enter project folder and run following command:

    $ npm install

Install the client library using git:

    $ git clone https://github.com/PSESD/CBO-Portal-API.git
    $ cd CBO-Portal-API
    $ npm install


## Getting started

The following examples configuration in JSON format.

**Install in your app `src` directory, and add/edit the default config file.**

    $ mkdir src/config
    $ vi src/config/development.json

    {
        "host": "<host_name>",
        "api": {
            "url": "https://api.***.com"
        },
        "auth": {
            "url": "https://auth.***.com"
        },
        "token": {
            "expires_in": 3600
        },
        "ratelimiter": {
            "windowMs": 60000,
            "delayAfter": 1,
            "delayMs": 1000,
            "max": 5,
            "message": "Too many requests, please try again later.",
            "statusCode": 429
        },
        "db": {
            "mongo": {
                "host": "<mongodb host>",
                "name": "<mongodb name>"
            },
            "mysql": {
                "host": "<mysql host>",
                "user": "<mysql user>",
                "password": "<mysql password>",
                "database": "ssl_cbo"
            }
        },
        "session": {
            "secret": "<secret>",
            "saveUninitialized": true,
            "resave": true
        },
        "mandrill": {
            "api_key": "<api_key>"
        },
        "hzb": {
            "default": "xsre",
            "sre": {
                 "url": "<api end point>",
                "sessionToken": "<session token>",
                "sharedSecret": "<secret>",
                "object": "sres",
                "service": "sres",
                "contextId": "CBO",
                "headers": {
                    "serviceType": "OBJECT",
                    "requestType": "IMMEDIATE",
                    "requestAction": "QUERY",
                    "messageType": "REQUEST",
                    "objectType": "sre",
                    "Accept": "application/xml",
                    "Content-Type": "application/xml"
                },
                "validation-url": "",
                "validation-service": ""
            },
            "xsre": {
                 "url": "<api end point>",
                "sessionToken": "<session token>",
                "sharedSecret": "<secret>",
                "object": "xSres",
                "service": "xSres",
                "contextId": "CBO",
                "headers": {
                    "serviceType": "OBJECT",
                    "requestType": "IMMEDIATE",
                    "requestAction": "QUERY",
                    "messageType": "REQUEST",
                    "objectType": "xSre",
                    "Accept": "application/xml",
                    "Content-Type": "application/xml"
                },
                "validation-url": "",
                "validation-service": ""
            },
            "CBOStudent": {
                "push": {
                    "url": "<api end point>",
                    "sessionToken": "<session token>",
                    "sharedSecret": "<secret>",
                    "object": "xSres",
                    "service1": "CBOStudents",
                    "service2": "CBOStudentsWithXSres",
                    "zoneId": "CBOUniversal",
                    "contextId": "DEFAULT",
                    "headers": {
                        "mustuseadvisory": true,
                        "requestType": "DELAYED",
                        "messageType": "REQUEST",
                        "objectType": "CBOStudent",
                        "requestAction": "QUERY",
                        "Content-Type": "application/xml"
                    }
                },
                "get": {
                    "url": "<api end point>",
                    "sessionToken": "<session token>",
                    "sharedSecret": "<secret>",
                    "object": "xSres",
                    "service1": "CBOStudents",
                    "service2": "CBOStudentsWithXSres",
                    "zoneId": "CBOUniversal",
                    "contextId": "DEFAULT",
                    "headers": {
                        "mustuseadvisory": true,
                        "requestType": "IMMEDIATE",
                        "messageType": "REQUEST",
                        "objectType": "CBOStudentsWithXSre",
                        "requestAction": "QUERY",
                        "Content-Type": "application/xml"
                    }
                }
            },
            "prs": {
                "url": "<api end point>",
                "sessionToken": "<session token>",
                "sharedSecret": "<secret>",
                "headers": {
                    "Accept": "application/xml"
                },
                "validation-url": "",
                "validation-service": ""
            }
        },
        "cross": {
            "enable": true,
            /** default: "*" */
            "allow_origin": "*",
            "allow_headers": "Authorization, Origin, X-Requested-With, Content-Type, Accept",
            "allow_method": "POST, GET, PUT, OPTIONS, DELETE"
        },
        "salt": "1f3f365ffdf4eb0777899420f0aca20a_test",
        "rollbar": {
            "access_token": "<rollbar_token>"
        },
        "aws": {
            "aws_access_key_id":"",
            "aws_secret_access_key":""
        },
        "cache": {
            "enable": true,
            "adapter": "memory",
            "backup": "redis",
            "redis": {
                "host": "localhost",
                "port": "6379",
                "db": 0,
                "ttl": 86400
            },
            "memory": {
                "max": 100,
                "ttl": 60
            }
        }
    }
    
    
**Edit config environment variable, this will be used on the cronjob CLI process**
    
    $ vi src/config/.env
    
    NODE_ENV=development

**Edit config overrides for production deployment:**

    $ vi src/config/production.json

    {
            "host": "<host_name>",
            "api": {
                "url": "https://api.***.com"
            },
            "auth": {
                "url": "https://auth.***.com"
            },
            "token": {
                "expires_in": 3600
            },
            "ratelimiter": {
                "windowMs": 60000,
                "delayAfter": 1,
                "delayMs": 1000,
                "max": 5,
                "message": "Too many requests, please try again later.",
                "statusCode": 429
            },
            "db": {
                "mongo": {
                    "host": "<mongodb host>",
                    "name": "<mongodb name>"
                },
                "mysql": {
                    "host": "<mysql host>",
                    "user": "<mysql user>",
                    "password": "<mysql password>",
                    "database": "ssl_cbo"
                }
            },
            "session": {
                "secret": "<secret>",
                "saveUninitialized": true,
                "resave": true
            },
            "mandrill": {
                "api_key": "<api_key>"
            },
            "hzb": {
                "default": "xsre",
                "sre": {
                     "url": "<api end point>",
                    "sessionToken": "<session token>",
                    "sharedSecret": "<secret>",
                    "object": "sres",
                    "service": "sres",
                    "contextId": "CBO",
                    "headers": {
                        "serviceType": "OBJECT",
                        "requestType": "IMMEDIATE",
                        "requestAction": "QUERY",
                        "messageType": "REQUEST",
                        "objectType": "sre",
                        "Accept": "application/xml",
                        "Content-Type": "application/xml"
                    },
                    "validation-url": "",
                    "validation-service": ""
                },
                "xsre": {
                     "url": "<api end point>",
                    "sessionToken": "<session token>",
                    "sharedSecret": "<secret>",
                    "object": "xSres",
                    "service": "xSres",
                    "contextId": "CBO",
                    "headers": {
                        "serviceType": "OBJECT",
                        "requestType": "IMMEDIATE",
                        "requestAction": "QUERY",
                        "messageType": "REQUEST",
                        "objectType": "xSre",
                        "Accept": "application/xml",
                        "Content-Type": "application/xml"
                    },
                    "validation-url": "",
                    "validation-service": ""
                },
                "CBOStudent": {
                    "push": {
                        "url": "<api end point>",
                        "sessionToken": "<session token>",
                        "sharedSecret": "<secret>",
                        "object": "xSres",
                        "service1": "CBOStudents",
                        "service2": "CBOStudentsWithXSres",
                        "zoneId": "CBOUniversal",
                        "contextId": "DEFAULT",
                        "headers": {
                            "mustuseadvisory": true,
                            "requestType": "DELAYED",
                            "messageType": "REQUEST",
                            "objectType": "CBOStudent",
                            "requestAction": "QUERY",
                            "Content-Type": "application/xml"
                        }
                    },
                    "get": {
                        "url": "<api end point>",
                        "sessionToken": "<session token>",
                        "sharedSecret": "<secret>",
                        "object": "xSres",
                        "service1": "CBOStudents",
                        "service2": "CBOStudentsWithXSres",
                        "zoneId": "CBOUniversal",
                        "contextId": "DEFAULT",
                        "headers": {
                            "mustuseadvisory": true,
                            "requestType": "IMMEDIATE",
                            "messageType": "REQUEST",
                            "objectType": "CBOStudentsWithXSre",
                            "requestAction": "QUERY",
                            "Content-Type": "application/xml"
                        }
                    }
                },
                "prs": {
                    "url": "<api end point>",
                    "sessionToken": "<session token>",
                    "sharedSecret": "<secret>",
                    "headers": {
                        "Accept": "application/xml"
                    },
                    "validation-url": "",
                    "validation-service": ""
                }
            },
            "cross": {
                "enable": true,
                /** default: "*" */
                "allow_origin": "*",
                "allow_headers": "Authorization, Origin, X-Requested-With, Content-Type, Accept",
                "allow_method": "POST, GET, PUT, OPTIONS, DELETE"
            },
            "salt": "1f3f365ffdf4eb0777899420f0aca20a_test",
            "rollbar": {
                "access_token": "<rollbar_token>"
            },
            "aws": {
                "aws_access_key_id":"",
                "aws_secret_access_key":""
            },
            "cache": {
                "enable": true,
                "adapter": "memory",
                "backup": "redis",
                "redis": {
                    "host": "localhost",
                    "port": "6379",
                    "db": 0,
                    "ttl": 86400
                },
                "memory": {
                    "max": 100,
                    "ttl": 60
                }
            }
        }
        
**Edit config environment variable, this will be used on the cronjob CLI process**        
        
        $ vi src/config/.env
            
        NODE_ENV=production
        

**Use configs in your code:**

    var config = require('./lib/utils').config();
    ...
    var dbConfig = config.get('db.mongo.host');
    db.connect(dbConfig, ...);

    if (config.has('salt')) {
      var salt = config.get('salt');
      ...
    }

`config.get()` will throw an exception for undefined keys to help catch typos and missing values.
Use `config.has()` to test if a configuration value is defined.


**Start your app server:**

Run server:

    $ cd src && npm start

Run server with environment `test`:

    $ cd src && npm test

Run Unit Test:

    $ cd src && mocha

## Cron Job

Docker crontab available on file: "cronjob/files/etc/ssl-cron"

Cronjob using crontab:

    0 0 * * * root NODE_CONFIG_DIR=/config /usr/bin/node /src/cli.js cache-list true >> /var/log/cron.log 2>&1
    0 */2 * * * root NODE_CONFIG_DIR=/config /usr/bin/node /src/cli.js cache-list >> /var/log/cron.log 2>&1
    0 0 * * * root NODE_CONFIG_DIR=/config /usr/bin/node /src/cli.js push-cedarlabs >> /var/log/cron.log 2>&1
    0 */3 * * * root NODE_CONFIG_DIR=/config /usr/bin/node /src/cli.js pull-cedarlabs >> /var/log/cron.log 2>&1
    
Cronjob run manually:
    
    /usr/bin/node /src/cli.js cache-list true
    /usr/bin/node /src/cli.js push-cedarlabs
    /usr/bin/node /src/cli.js pull-cedarlabs


## Table schema for reporting

Table student:

    CREATE TABLE `students` (
      `id` varchar(100) NOT NULL,
      `org_name` varchar(100) DEFAULT NULL,
      `student_id` varchar(50) DEFAULT NULL,
      `school_district` varchar(50) DEFAULT NULL,
      `school` varchar(100) DEFAULT NULL,
      `first_name` varchar(100) DEFAULT NULL,
      `last_name` varchar(100) DEFAULT NULL,
      `grade_level` int(11) DEFAULT NULL,
      `ethnicity` varchar(100) DEFAULT NULL,
      `gender` enum('Male','Female') DEFAULT NULL,
      `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY `id` (`id`,`student_id`,`school_district`,`gender`,`grade_level`,`ethnicity`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1

Table student program:

    CREATE TABLE `student_programs` (
      `program_id` varchar(50) NOT NULL,
      `student_id` varchar(50) NOT NULL,
      `program_name` varchar(100) NOT NULL,
      `cohorts` varchar(300) DEFAULT NULL,
      `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`program_id`,`student_id`,`program_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1

### Configurations

CBO OAuth2 accepts an object with the following valid params.

* `client_id` - Required registered Client ID.
* `client_secret` - Required registered Client secret.
* `redirect_uri` - One of the redirect URIs.
* `grant_type` - Defined in the OAuth 2.0 specification, this field must contain a value of `authorization_code`.



## Contributing

Fork the repo on github and send a pull requests with topic branches. Do not forget to
provide specs to your contribution.


### Running specs

* Fork and clone the repository (`dev` branch).
* Run `npm install` for dependencies.
* Run `npm start` to start server.
* Run `npm test` to start server with env `test`.

## Tools used

[httpie](https://github.com/jkbr/httpie) - command line HTTP client

## Make Requests


## Coding guidelines

Follow [github](https://github.com/styleguide/) guidelines.


## Feedback

Use the [issue tracker](https://github.com/PSESD/CBO-Portal-API/issues) for bugs.
[Mail](mailto:support@upwardstech.com) us
for any idea that can improve the project.


## Links

* [GIT Repository](https://github.com/PSESD/CBO-Portal-API)
* [Documentation](https://github.com/PSESD/CBO-Portal-API)


## Authors

--- 


## Contributors

Special thanks to the following people for submitting patches.


## Changelog

See [CHANGELOG](https://github.com/PSESD/CBO-Portal-API/master/CHANGELOG.md)


## Copyright

Copyright (c) 2015

This project is released under the [MIT License](http://opensource.org/licenses/MIT).
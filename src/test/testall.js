'use strict';

process.env.NODE_ENV = 'test';
var expect = require( 'chai' ).expect;
var request = require( 'supertest' );
var cheerio = require( 'cheerio' );
var url = 'http://localhost:3000';
var api_endpoint = 'http://localhost:4000';
var config = require('config');
var dbUri = 'mongodb://'+config.get('db.mongo.host')+'/'+config.get('db.mongo.name');
console.log(dbUri);
var mongoose = require( 'mongoose' )
    , clearDB = require( 'mocha-mongoose' )( dbUri, {noClear: true} );

describe( 'OAuth2-Api End Point', function () {

    var agent1 = request.agent( url );
    /**
     * Store transaction Id to use in post request
     */
    var transactionId;
    /**
     * Store accessCode to be used to retrive access token
     */
    var accessCode;
    var token;

    var username = 'zaenal';
    var password = 'demo';
    var client_id = 'zaenal';
    var name  = 'zaenal';
    var client_secret = 'demo_client_secret';

    before( function (done) {
        if (mongoose.connection.db) return done();
        mongoose.connect( dbUri, done );
    } );

    before( function (done) {
        //clearDB( done );
        done();
    } );

    it( 'user should be able to list clients', function (done) {
        request( url ).get( '/api/clients' )
            .auth( username, password )
            .expect( 'Content-Type', /json/ )
            .expect( 200 )
            .expect( function (res) {
                //console.dir( res.body );
            } )
            .end( done );

    } );

    it( 'user should be able get authorised page', function (done) {
        var target = '/api/oauth2/authorize?client_id=client&response_type=code&redirect_uri='+api_endpoint;
        agent1.get( target )
            .auth( username, password )
            .set( 'Accept', 'application/json' )
            .set( 'Accept', 'text/html' )
            .type( 'urlencoded' )
            .expect( function (res) {
                var html = cheerio.load( res.text );
                //cookieId = req.headers['set-cookie'][0]
                transactionId = html( 'input[type="hidden"]' ).val();
            } )
            .expect( 200 )
            .end( done );

    } );

    it( 'user should be able to authorise an access code', function (done) {
        agent1.post( '/api/oauth2/authorize' )
            .auth( username, password )
            .type( 'form' )
            .send( {
                transaction_id: transactionId
            } )
            .expect( 302 )
            .expect( function (res) {
                accessCode = res.text.split( 'code=' )[1];
            } )
            .end( done );

    } );

    it( 'use access code to get a token', function (done) {
        request( url ).post( '/api/oauth2/token' )
            .auth( 'client', 'secret' )
            .expect( 'Content-Type', /json/ ).type( 'form' )
            .send( {
                code        : accessCode,
                grant_type  : 'authorization_code',
                redirect_uri: api_endpoint
            } )
            .type( 'urlencoded' )
            .expect( 200 )
            .expect( function (res) {
                token = res.body.access_token;
                var tokenType = res.body.token_type;
                console.log('Url: ' + api_endpoint + '/user', 'authorization: ' + tokenType + ' ' + token);
                request(api_endpoint)
                    .get('/user')
                    .set('authorization', tokenType + ' ' + token)
                    .expect( function (res) {
                        console.dir(res.body);
                    } )
                    .expect( 200 )
                    .end(function(err, res) {
                        if (err) return done(err);
                        console.log(res);
                        done();
                    });
            } )
            .end( done );

    } );


    after( function (done) {
        done();
    } )

} );
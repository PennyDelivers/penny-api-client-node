'use strict';
/**
 * test/test.client.js
 *
 * @author Chen Liang [code@chen.technology]
 */
/*eslint no-unused-expressions: 0*/
/*!
 * Module dependencies.
 */
var nock = require('nock');
var PennyApiClient = require('./../lib');

var host = 'https://api.pennydelivers.com';

describe('Client', function() {
  beforeEach(function() {
    this.client = new PennyApiClient({
      host: host,
    });
    this.client.use({
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });
  });
  describe('new', function() {
    before(function() {
      this.newClinet = new PennyApiClient({
        host: host,
      });
    });
    after(function() {
      delete this.newClinet;
    });
    it('has host = `' + host + '`', function() {
      this.newClinet.host
        .should.equal(host);
    });
    it('has agent = `penny-api-client-node`', function() {
      this.newClinet.agent
        .should.equal('penny-api-client-node');
    });
    it('.clientId = null', function() {
      expect(this.newClinet.clientId)
        .to.equal(null);
    });
    it('.clientSecret = null', function() {
      expect(this.newClinet.clientSecret)
        .to.equal(null);
    });
    it('.token = null', function() {
      expect(this.newClinet.token)
        .to.equal(null);
    });
    it('.refreshToken = null', function() {
      expect(this.newClinet.refreshToken).to.equal(null);
    });
  });
  describe('#use(object)', function() {
    beforeEach(function() {
      this.useClient = new PennyApiClient();
    });
    afterEach(function() {
      delete this.useClient;
    });
    it('is a function', function() {
      expect(this.useClient.use)
        .to.be.a('function');
    });
    it('set clientId', function() {
      expect(this.useClient.clientId).to.equal(null);
      this.useClient.use({
        clientId: 'newClientId',
      });
      expect(this.useClient.clientId).to.equal('newClientId');
    });
    it('set clientSecret', function() {
      expect(this.useClient.clientSecret).to.equal(null);
      this.useClient.use({
        clientSecret: 'newclientSecret',
      });
      expect(this.useClient.clientSecret).to.equal('newclientSecret');
    });
  });
  describe('#authenticateClient(options)', function() {
    beforeEach(function() {
      this.scope = nock(host)
        .matchHeader('authorization', 'Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0')
        .matchHeader('accept', 'application/json')
        .post('/auth/oauth/token', {
          grant_type: 'client_credentials',
          scope: 'basic',
        })
        .reply(200, {
          'token_type': 'Bearer',
          'access_token': '7e628f4e-8360-4d87-8a7d-548dcb399ffe',
          'expires_in': '2014-12-23T09:19:35.472Z',
        });
    });
    afterEach(function() {
      this.scope.isDone().should.be.ok;
    });
    it('send clientId, clientSecret', function(done) {
      var self = this;
      this.client.authenticateClient()
        .then(function(res) {
          expect(res).to.deep.equal({
            'token_type': 'Bearer',
            'access_token': '7e628f4e-8360-4d87-8a7d-548dcb399ffe',
            'expires_in': '2014-12-23T09:19:35.472Z',
          });
          self.client.token
            .should.equal('7e628f4e-8360-4d87-8a7d-548dcb399ffe');
          self.client.isClientAuthenticated
            .should.equal(true);
        })
        .should.notify(done);
    });
    it('takes options.storeToken = false', function(done) {
      expect(this.client.token).to.not.exist;
      var self = this;
      this.client.authenticateClient({
        storeToken: false,
      })
        .then(function(res) {
          expect(res).to.deep.equal({
            'token_type': 'Bearer',
            'access_token': '7e628f4e-8360-4d87-8a7d-548dcb399ffe',
            'expires_in': '2014-12-23T09:19:35.472Z',
          });
          expect(self.client.token).to.not.exist;
          self.client.isClientAuthenticated
            .should.equal(false);
        })
        .should.notify(done);
    });
  });
  describe('#exchangeRefreshTokenForAccessToken(refreshToken, options)', function() {
    beforeEach(function() {
      this.scope = nock(host)
        .matchHeader('authorization', 'Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0')
        .matchHeader('accept', 'application/json')
        .post('/auth/oauth/token', {
          grant_type: 'refresh_token',
          refresh_token: 'rtk',
        })
        .reply(200, {
          'token_type': 'Bearer',
          'access_token': '7e628f4e-8360-4d87-8a7d-548dcb399ffe',
          'expires_in': '2014-12-23T09:19:35.472Z',
        });
    });
    afterEach(function() {
      this.scope.isDone().should.be.ok;
    });
    it('send refresh_token, grant_type', function(done) {
      var self = this;
      this.client.exchangeRefreshTokenForAccessToken('rtk')
        .then(function(res) {
          expect(res).to.deep.equal({
            'token_type': 'Bearer',
            'access_token': '7e628f4e-8360-4d87-8a7d-548dcb399ffe',
            'expires_in': '2014-12-23T09:19:35.472Z',
          });
          self.client.token
            .should.equal('7e628f4e-8360-4d87-8a7d-548dcb399ffe');
          // self.client.isClientAuthenticated
          //   .should.equal(true);
        })
        .should.notify(done);
    });
  });
  describe('#authenticateUser(username, password, scope)', function() {
    beforeEach(function() {
      this.scope = nock(host)
        .matchHeader('authorization', 'Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0')
        .matchHeader('accept', 'application/json')
        .post('/auth/oauth/token', {
          'grant_type': 'password',
          username: 'demo@example.com',
          password: '12345678',
          scope: 'offline_access',
        })
        .reply(200, {
          'access_token': '3c422236-50e0-423b-bb94-53cc5129e322',
          'refresh_token': '5958cebc-c0d0-410d-aeb6-d56e13ef31a4',
          'expires_in': '2014-10-03T03:24:39.681Z',
          'token_type': 'Bearer',
        });
    });
    afterEach(function() {
      this.scope.isDone().should.be.ok;
    });
    it('send clientId, clientSecret', function(done) {
      var self = this;
      this.client.authenticateUser('demo@example.com', '12345678')
        .then(function(res) {
          expect(res).to.deep.equal({
            'access_token': '3c422236-50e0-423b-bb94-53cc5129e322',
            'refresh_token': '5958cebc-c0d0-410d-aeb6-d56e13ef31a4',
            'expires_in': '2014-10-03T03:24:39.681Z',
            'token_type': 'Bearer',
          });
          self.client.token
            .should.equal('3c422236-50e0-423b-bb94-53cc5129e322');
          self.client.refreshToken
            .should.equal('5958cebc-c0d0-410d-aeb6-d56e13ef31a4');
          self.client.isClientAuthenticated
            .should.equal(true);
          self.client.isUserAuthenticated
            .should.equal(true);
        })
        .should.notify(done);
    });
  });
});

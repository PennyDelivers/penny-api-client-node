'use strict';
/**
 * penny-api-client-node
 *
 * @author Chen Liang [code@chen.technology]
 */

/*!
 * Module dependencies.
 */

var request = require('superagent');
var Promise = require('bluebird');
var errors = require('./errors');
var _ = require('lodash');
var debug = require('debug')('penny-api-client');

class PennyApiClient {
  constructor(options) {
    options = options || {};
    this.host = options.host || 'https://api.pennydelivers.com';
    debug('host', this.host);
    this.urlPrefix = options.urlPrefix;
    this.agent = options.agent || 'penny-api-client-node';

    this.clientId = options.clientId || null;
    this.clientSecret = options.clientSecret || null;
    this.autoClientAuth = options.autoClientAuth || false;
    this.token = null;
    this.refreshToken = null;
    this.isClientAuthenticated = false;
    this.isUserAuthenticated = false;
    this.returnRequest = options.returnRequest;
    this.transport = options.transport || null;
  }

  apiRequestForRoute(routeObj) {
    var path = this.transport ? routeObj.path : this.host + routeObj.path;
    return this._generateApiRequest(
      routeObj.method,
      path,
      routeObj.params,
      routeObj.payloads
    );
  };

  process(req, attachBearerToken, returnRequest, options) {
    debug('process', 'returnRequest', this.returnRequest, options);
    options = options || {};
    if (attachBearerToken) {
      var token = options.token || this.token;
      if (token) {
        req.set('Authorization', 'Bearer ' + token);
      }
    }
    if (this.returnRequest === true && returnRequest !== false) {
      debug('process', 'returnRequest');
      return req;
    }
    var ctx = {
      request: req,
    };
    return new Promise(function(resolve, reject) {
      req.end(function(err, res) {
        ctx.response = res;
        if (err) {
          err.code = res ? res.statusCode : 999;
          return reject(err);
        }
        return resolve(res.body);
      });
    })
      .bind(ctx)
      .catch(function(err) {
        debug('process', 'err', err);
        throw err;
      });
  }

  _generateApiRequest(method, path, params, payloads) {
    debug('_generateApiRequest', 'transport', !!this.transport);
    var req = request;
    if (this.transport) {
      req = this.transport;
    }
    if (method === 'GET') {
      req = req.get(path);
    }
    if (method === 'POST') {
      req = req.post(path);
    }
    if (method === 'PUT') {
      req = req.put(path);
    }
    if (method === 'DELETE') {
      req = req.del(path);
    }

    if (params) {
      req = req.query(params);
    }

    if ((method === 'POST' || method === 'PUT') && payloads) {
      req = req.send(payloads);
    }

    req.set('Accept', 'application/json');

    return req;
  };

  _processRouteRequest(route, options) {
    var self = this;
    var req = this.apiRequestForRoute(route);
    var processPromise = this.process(req, true, options.returnRequest, {
      token: options.token,
    });

    if (options.returnRequest === true ||
      (this.returnRequest === true && options.returnRequest !== false)) {
      return processPromise;
    }

    var autoClientAuth = _.isBoolean(options.autoClientAuth) ?
      options.autoClientAuth : this.autoClientAuth;

    return processPromise
      .catch(function(err) {
        if (err instanceof errors.ApiClientError) {
          throw err;
        }
        if (err.code === 401 && autoClientAuth) {
          throw new errors.Retry('retry', err);
        }
        throw err;
      })
      .catch(errors.Retry, function(err) {
        // check if has refreshToken
        let reAuthReq = self.refreshToken ?
          self.exchangeRefreshTokenForAccessToken(self.refreshToken) :
          self.authenticateClient();
        return reAuthReq
          .then(function() {
            return self._processRouteRequest(route, options);
          });
      });
  };

  _plainRequest(method, path, params, payloads, options) {
    debug('_plainRequest', method, path, params, payloads, options);
    options = options || {};
    var route = {
      method: method,
      path: path,
      params: params,
      payloads: payloads,
    };
    return this._processRouteRequest(route, options);
  };

  get(path, params, options) {
    return this._plainRequest('GET', path, params, null, options);
  };

  post(path, params, payloads, options) {
    return this._plainRequest('POST', path, params, payloads, options);
  };
  put(path, params, payloads, options) {
    return this._plainRequest('PUT', path, params, payloads, options);
  };

  delete(path, params, options) {
    return this._plainRequest('DELETE', path, params, null, options);
  };

  use(object) {
    if (!object) {
      return;
    }
    if (object.clientId) {
      this.clientId = object.clientId;
    }
    if (object.clientSecret) {
      this.clientSecret = object.clientSecret;
    }
  };

  authenticateClient(options) {
    debug('authenticateClient');
    options = options || {};
    var self = this;
    var route = {
      method: 'POST',
      path: '/auth/oauth/token',
      params: null,
      payloads: {
        'grant_type': 'client_credentials',
        scope: 'basic',
      },
    };
    var req = this.apiRequestForRoute(route)
      .auth(this.clientId, this.clientSecret);
    return this.process(req)
      .then(function(resBody) {
        if (options.storeToken === false) {
          return resBody;
        }
        if (resBody && resBody.token_type) {
          self.token = resBody.access_token;
          self.isClientAuthenticated = true;
        }
        return resBody;
      })
      .catch(function(err) {
        debug('authenticateClient', err);
        throw err;
      });
  };

  exchangeRefreshTokenForAccessToken(refreshToken, options) {
    debug('exchangeRefreshTokenForAccessToken');
    options = options || {};
    let self = this;
    let route = {
      method: 'POST',
      path: '/auth/oauth/token',
      params: null,
      payloads: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
    };
    var req = this.apiRequestForRoute(route)
      .auth(this.clientId, this.clientSecret);
    return this.process(req)
      .then(function(resBody) {
        if (options.storeToken === false) {
          return resBody;
        }
        if (resBody && resBody.token_type) {
          self.token = resBody.access_token;
        }
        return resBody;
      })
      .catch(function(err) {
        debug('exchangeRefreshTokenForAccessToken', err);
        throw err;
      });
  }

  authenticateUser(username, password, scope) {
    debug('authenticateUser', username, scope);
    var self = this;
    let route = {
      method: 'POST',
      path: '/auth/oauth/token',
      params: null,
      payloads: {
        'grant_type': 'password',
        username: username,
        password: password,
        scope: scope || 'offline_access',
      },
    };
    var req = this.apiRequestForRoute(route);
    return this.process(req.auth(this.clientId, this.clientSecret))
      .then(function(res) {
        if (this.response.statusCode !== 200) {
          return Promise.reject(
            new Error('unable to authenticateUser, statusCode: ' +
              this.response.statusCode)
          );
        }
        if (res && res.token_type) {
          self.token = res.access_token;
          self.refreshToken = res.refresh_token;
          self.isClientAuthenticated = true;
          self.isUserAuthenticated = true;
        }
        return res;
      });
  };
}


module.exports = PennyApiClient;

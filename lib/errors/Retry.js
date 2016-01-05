'use strict';
/**
 * errors/ApiClientError.js
 *
 * errors.ApiClientError
 *
 * @author Chen Liang [code@chen.technology]
 */

/*!
 * Module dependencies.
 */
var ApiClientError = require('./ApiClientError');

/**
 * The task is to be retried later.
 *
 * @exports errors.Retry
 * @extends {errors.ApiClientError}
 * @constructor
 *
 * @param {String} message message describing context of retry.
 *                         @optional
 * @param {Error} originalError  Exception (if any) that caused the retry to happen.
 * @param {Date|Number} eta Time of retry (ETA)
 */

class Retry extends ApiClientError {
  constructor(message, originalError, eta) {
    super(message);
    this.originalError = originalError;
    if (eta) {
      if (Number.isInteger(eta)) {
        eta = new Date(eta);
      }
    }
    this.eta = eta;
  }
}

module.exports = Retry;

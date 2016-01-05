'use strict';
/**
 * errors/ApiClientError.js
 *
 * errors.ApiClientError
 *
 * @author Chen Liang [code@chen.technology]
 */

class ApiClientError extends Error {
  constructor(message) {
    super(message);
  }

  get name() {
    return this.constructor.name;
  }
}

module.exports = ApiClientError;

'use strict';
/**
 * test.root.js
 *
 * root test for mocha
 *
 * @author Chen Liang [code@chen.technology]
 */

/*!
 * Module dependencies.
 */

var sinonChai = require('sinon-chai');
global.sinon = require('sinon');
var chai = require('chai');
chai.should();
global.expect = chai.expect;

chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
chai.use(sinonChai);

const expect = require('chai').expect;
const sinon = require('sinon');

const logger = require('../../../../packages/workbox-cli/src/lib/cleanup-stack-trace');

describe(`[workbox-cli] lib/cleanup-strack-trace.js`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  // TODO: Tests, if we keep this module.
});


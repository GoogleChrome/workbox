const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe(`src/lib/utils/warn-about-config.js`, function() {
  const CONFIG = {
    optionOne: 1,
    optionTwo: 2,
  };

  const warnSpy = sinon.spy();
  const warnAboutConfig = proxyquire('../../src/lib/utils/warn-about-config', {
    '../log-helper': {
      warn: warnSpy,
    },
  });

  beforeEach(function() {
    warnSpy.reset();
  });

  it(`should call logHelper.warn() when there's a config option that matches the blacklist`, function() {
    warnAboutConfig(['optionOne'], CONFIG, 'testing');
    expect(warnSpy.called).to.be.true;
  });

  it(`should not call logHelper.warn() when none of the config options match the blacklist`, function() {
    warnAboutConfig(['optionThree'], CONFIG, 'testing');
    expect(warnSpy.called).to.be.false;
  });
});

const expect = require('chai').expect;

const cdnUtils = require('../../../../packages/workbox-build/src/lib/cdn-utils');
const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`[workbox-build] lib/cdn-utils.js`, function() {
  const CDN_ORIGIN = 'https://storage.googleapis.com/workbox-cdn/releases';

  it(`getCDNOrigin() should return the expected base URL`, function() {
    const url = cdnUtils.getCDNOrigin();
    expect(url).to.eql(CDN_ORIGIN);
  });

  it(`getModuleUrl() should throw when moduleName is undefined`, function() {
    expect(
      () => cdnUtils.getModuleUrl()
    ).to.throw(errors['no-module-name']);
  });

  it(`getModuleUrl('workbox-sw', 'dev') should throw`, function() {
    expect(
      () => cdnUtils.getModuleUrl('workbox-sw', 'dev')
    ).to.throw('workbox-sw');
  });

  it(`getModuleUrl(moduleName) should return the expected URL`, function() {
    const moduleName = 'workbox-sw';
    const url = cdnUtils.getModuleUrl(moduleName);

    expect(url.startsWith(CDN_ORIGIN)).to.be.true;
    expect(url.includes(moduleName)).to.be.true;
  });

  it(`getModuleUrl('workbox-routing', buildType) should return the expected URL`, function() {
    const moduleName = 'workbox-routing';
    const buildType = 'prod';

    const url = cdnUtils.getModuleUrl(moduleName, buildType);

    expect(url.startsWith(CDN_ORIGIN)).to.be.true;
    expect(url.includes(moduleName)).to.be.true;
    expect(url.includes(buildType)).to.be.true;
  });
});

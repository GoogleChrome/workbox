/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const cdnUtils = require('../../../../packages/workbox-build/build/lib/cdn-utils');
const {errors} = require('../../../../packages/workbox-build/build/lib/errors');

describe(`[workbox-build] lib/cdn-utils.js`, function () {
  const CDN_ORIGIN = 'https://storage.googleapis.com/workbox-cdn/releases';

  it(`getModuleURL() should throw when moduleName is undefined`, function () {
    expect(() => cdnUtils.getModuleURL()).to.throw(errors['no-module-name']);
  });

  it(`getModuleURL('workbox-sw', 'dev') should throw`, function () {
    expect(() => cdnUtils.getModuleURL('workbox-sw', 'dev')).to.throw(
      'workbox-sw',
    );
  });

  it(`getModuleURL(moduleName) should return the expected URL`, function () {
    const moduleName = 'workbox-sw';
    const url = cdnUtils.getModuleURL(moduleName);

    expect(url.startsWith(CDN_ORIGIN)).to.be.true;
    expect(url.includes(moduleName)).to.be.true;
  });

  it(`getModuleURL('workbox-routing', buildType) should return the expected URL`, function () {
    const moduleName = 'workbox-routing';
    const buildType = 'prod';

    const url = cdnUtils.getModuleURL(moduleName, buildType);

    expect(url.startsWith(CDN_ORIGIN)).to.be.true;
    expect(url.includes(moduleName)).to.be.true;
    expect(url.includes(buildType)).to.be.true;
  });
});

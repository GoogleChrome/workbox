/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const useBuildType = require('../../../../packages/workbox-build/src/lib/use-build-type');

describe(`[workbox-build] lib/use-build-type.js`, function() {
  it(`should not update anything when buildType is 'prod'`, function() {
    const result = useBuildType('/path/to/workbox.prod.js', 'prod');
    expect(result).to.eql('/path/to/workbox.prod.js');
  });

  it(`should update when buildType is 'dev'`, function() {
    const result = useBuildType('/path/to/workbox.prod.js', 'dev');
    expect(result).to.eql('/path/to/workbox.dev.js');
  });

  it(`should only update the last match when buildType is 'dev'`, function() {
    const result = useBuildType('/path/to/production/and.prod.check/workbox.prod.js', 'dev');
    expect(result).to.eql('/path/to/production/and.prod.check/workbox.dev.js');
  });

  it(`should not update anything if there is no match for the default build type`, function() {
    const result = useBuildType('/does/not/match', 'dev');
    expect(result).to.eql('/does/not/match');
  });
});

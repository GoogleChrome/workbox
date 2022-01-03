/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');

describe(`[workbox-build] lib/translate-url-to-sourcemap-paths.ts`, function () {
  const MODULE_PATH =
    '../../../../packages/workbox-build/build/lib/translate-url-to-sourcemap-paths';
  const URL = 'sw.js.map';
  const SWSRC = 'src/sw.js';
  const SWDEST = 'dist/sw.js';

  it(`should return undefined paths when url is undefined`, function () {
    const {translateURLToSourcemapPaths} = require(MODULE_PATH);

    const {destPath, srcPath, warning} = translateURLToSourcemapPaths(
      undefined,
      SWSRC,
      SWDEST,
    );

    expect(destPath).to.be.undefined;
    expect(srcPath).to.be.undefined;
    expect(warning).to.be.undefined;
  });

  it(`should return undefined paths when url starts with data:`, function () {
    const {translateURLToSourcemapPaths} = require(MODULE_PATH);

    const {destPath, srcPath, warning} = translateURLToSourcemapPaths(
      `data:${URL}`,
      SWSRC,
      SWDEST,
    );

    expect(destPath).to.be.undefined;
    expect(srcPath).to.be.undefined;
    expect(warning).to.be.undefined;
  });

  it(`should return undefined paths and a warning when the resolved URL path doesn't exist`, function () {
    const {translateURLToSourcemapPaths} = proxyquire(MODULE_PATH, {
      'fs-extra': {
        existsSync: () => false,
      },
    });

    const {destPath, srcPath, warning} = translateURLToSourcemapPaths(
      URL,
      SWSRC,
      SWDEST,
    );

    expect(destPath).to.be.undefined;
    expect(srcPath).to.be.undefined;
    expect(warning).to.include(errors['cant-find-sourcemap']);
  });

  it(`should return valid paths and no warning when the resolved URL path exists`, function () {
    const {translateURLToSourcemapPaths} = proxyquire(MODULE_PATH, {
      'fs-extra': {
        existsSync: () => true,
      },
      'upath': {
        resolve: (...args) => args.join('/'),
      },
    });

    const {destPath, srcPath, warning} = translateURLToSourcemapPaths(
      URL,
      SWSRC,
      SWDEST,
    );

    expect(destPath).to.eql('dist/sw.js.map');
    expect(srcPath).to.eq('src/sw.js.map');
    expect(warning).to.be.undefined;
  });
});

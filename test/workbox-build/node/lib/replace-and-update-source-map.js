/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const {
  replaceAndUpdateSourceMap,
} = require('../../../../packages/workbox-build/build/lib/replace-and-update-source-map');

describe(`[workbox-build] lib/replace-and-update-source-map`, function () {
  // Test case borrowed from https://github.com/Rich-Harris/magic-string/blob/a312519cfe9caa78ade7f09cc2b07459d3d17f4d/test/MagicString.js#L225
  const JS_FILENAME = 'file.js';
  const SOURCE = `abcdefkl`;
  const SOURCE_MAP = {
    file: JS_FILENAME,
    mappings: 'AAAA,GAAG,GAAG,AAAG,CAAC',
    names: ['testing'],
    sourceRoot: '.',
    sources: ['test.js'],
    sourcesContent: ['abcdefghijkl'],
    version: 3,
  };

  it(`should be a no-op if there's no match`, async function () {
    const {map, source} = await replaceAndUpdateSourceMap({
      jsFilename: JS_FILENAME,
      originalSource: SOURCE,
      originalMap: SOURCE_MAP,
      searchString: 'is-not-found',
      replaceString: 'ignored',
    });

    expect(JSON.parse(map)).to.eql(SOURCE_MAP);
    expect(source).to.eql(SOURCE);
  });

  it(`should be perform the replacement and update the sourcemap when there is a match`, async function () {
    const searchString = 'bc';
    const replaceString = 'wxyz';

    const {map, source} = await replaceAndUpdateSourceMap({
      searchString,
      replaceString,
      jsFilename: JS_FILENAME,
      originalSource: SOURCE,
      originalMap: SOURCE_MAP,
    });

    const expectedSourceMap = Object.assign({}, SOURCE_MAP, {
      mappings: 'AAAA,KAAG,GAAG,AAAG,CAAC',
    });

    expect(JSON.parse(map)).to.eql(expectedSourceMap);
    expect(source).to.eql('awxyzdefkl');
  });
});

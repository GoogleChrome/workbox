/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const {
  transformManifest,
} = require('../../../../packages/workbox-build/build/lib/transform-manifest');

describe(`[workbox-build] lib/transform-manifest.js`, function () {
  const MAXIMUM_FILE_SIZE = 1234;
  const ENTRY1 = {
    file: 'file1.txt',
    size: MAXIMUM_FILE_SIZE - 1,
    hash: 'hash1',
  };
  const ENTRY2 = {
    file: 'file2.txt',
    size: MAXIMUM_FILE_SIZE,
    hash: 'hash2',
  };
  const ENTRY3 = {
    file: 'file3.txt',
    size: MAXIMUM_FILE_SIZE + 1,
    hash: 'hash3',
  };
  const FILE_DETAILS = [ENTRY1, ENTRY2, ENTRY3];

  it(`should filter out files above maximumFileSizeToCacheInBytes`, async function () {
    const {size, count, manifestEntries} = await transformManifest({
      maximumFileSizeToCacheInBytes: MAXIMUM_FILE_SIZE,
      fileDetails: FILE_DETAILS,
    });

    expect(size).to.eql(ENTRY1.size + ENTRY2.size);
    expect(count).to.eql(2);
    expect(manifestEntries).to.deep.equal([
      {
        url: ENTRY1.file,
        revision: ENTRY1.hash,
      },
      {
        url: ENTRY2.file,
        revision: ENTRY2.hash,
      },
    ]);
  });

  it(`should remove revision info based on dontCacheBustURLsMatching`, async function () {
    const {size, count, manifestEntries} = await transformManifest({
      dontCacheBustURLsMatching: new RegExp(ENTRY1.file),
      fileDetails: FILE_DETAILS,
    });

    expect(size).to.eql(ENTRY1.size + ENTRY2.size + ENTRY3.size);
    expect(count).to.eql(3);
    expect(manifestEntries).to.deep.equal([
      {
        url: ENTRY1.file,
        revision: null,
      },
      {
        url: ENTRY2.file,
        revision: ENTRY2.hash,
      },
      {
        url: ENTRY3.file,
        revision: ENTRY3.hash,
      },
    ]);
  });

  it(`should modify the URLs based on modifyURLPrefix`, async function () {
    const prefix = 'prefix/';

    const {size, count, manifestEntries} = await transformManifest({
      modifyURLPrefix: {
        '': prefix,
      },
      fileDetails: FILE_DETAILS,
    });

    expect(size).to.eql(ENTRY1.size + ENTRY2.size + ENTRY3.size);
    expect(count).to.eql(3);
    expect(manifestEntries).to.deep.equal([
      {
        url: prefix + ENTRY1.file,
        revision: ENTRY1.hash,
      },
      {
        url: prefix + ENTRY2.file,
        revision: ENTRY2.hash,
      },
      {
        url: prefix + ENTRY3.file,
        revision: ENTRY3.hash,
      },
    ]);
  });

  it(`should use custom manifestTransforms`, async function () {
    const prefix1 = 'prefix1/';
    const prefix2 = 'prefix2/';

    const warning1 = 'test warning 1';
    const warning2 = 'test warning 1';

    const transformParam = 'test param';

    const transform1 = (files, param) => {
      expect(param).to.eql(transformParam);

      const manifest = files.map((file) => {
        file.url = prefix1 + file.url;
        return file;
      });
      return {manifest, warnings: [warning1]};
    };

    const transform2 = (files, param) => {
      expect(param).to.eql(transformParam);

      const manifest = files.map((file) => {
        file.url = prefix2 + file.url;
        return file;
      });
      return {manifest, warnings: [warning2]};
    };

    const {size, count, manifestEntries, warnings} = await transformManifest({
      fileDetails: FILE_DETAILS,
      manifestTransforms: [transform1, transform2],
      transformParam,
    });

    expect(warnings).to.eql([warning1, warning2]);
    expect(size).to.eql(ENTRY1.size + ENTRY2.size + ENTRY3.size);
    expect(count).to.eql(3);
    expect(manifestEntries).to.deep.equal([
      {
        url: prefix2 + prefix1 + ENTRY1.file,
        revision: ENTRY1.hash,
      },
      {
        url: prefix2 + prefix1 + ENTRY2.file,
        revision: ENTRY2.hash,
      },
      {
        url: prefix2 + prefix1 + ENTRY3.file,
        revision: ENTRY3.hash,
      },
    ]);
  });

  it(`should support an async manifestTransform`, async function () {
    const asyncTransform = async (manifest) => {
      await Promise.resolve();
      return {manifest, warnings: []};
    };

    const {size, count, manifestEntries, warnings} = await transformManifest({
      fileDetails: FILE_DETAILS,
      manifestTransforms: [asyncTransform],
    });

    expect(warnings).to.be.empty;
    expect(size).to.eql(ENTRY1.size + ENTRY2.size + ENTRY3.size);
    expect(count).to.eql(3);
    expect(manifestEntries).to.deep.equal([
      {
        url: ENTRY1.file,
        revision: ENTRY1.hash,
      },
      {
        url: ENTRY2.file,
        revision: ENTRY2.hash,
      },
      {
        url: ENTRY3.file,
        revision: ENTRY3.hash,
      },
    ]);
  });
});

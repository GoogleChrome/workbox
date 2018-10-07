/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const filterFiles = require('../../../../packages/workbox-build/src/lib/filter-files');

describe(`[workbox-build] lib/filter-files.js`, function() {
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

  it(`should filter out files above maximumFileSizeToCacheInBytes`, async function() {
    const {size, count, manifestEntries} = filterFiles({
      maximumFileSizeToCacheInBytes: MAXIMUM_FILE_SIZE,
      fileDetails: FILE_DETAILS,
    });

    expect(size).to.eql(ENTRY1.size + ENTRY2.size);
    expect(count).to.eql(2);
    expect(manifestEntries).to.deep.equal([{
      url: ENTRY1.file,
      revision: ENTRY1.hash,
    }, {
      url: ENTRY2.file,
      revision: ENTRY2.hash,
    }]);
  });

  it(`should remove revision info based on dontCacheBustUrlsMatching`, async function() {
    const {size, count, manifestEntries} = filterFiles({
      dontCacheBustUrlsMatching: new RegExp(ENTRY1.file),
      fileDetails: FILE_DETAILS,
    });

    expect(size).to.eql(ENTRY1.size + ENTRY2.size + ENTRY3.size);
    expect(count).to.eql(3);
    expect(manifestEntries).to.deep.equal([{
      url: ENTRY1.file,
    }, {
      url: ENTRY2.file,
      revision: ENTRY2.hash,
    }, {
      url: ENTRY3.file,
      revision: ENTRY3.hash,
    }]);
  });

  it(`should modify the URLs based on modifyUrlPrefix`, async function() {
    const prefix = 'prefix/';

    const {size, count, manifestEntries} = filterFiles({
      modifyUrlPrefix: {
        '': prefix,
      },
      fileDetails: FILE_DETAILS,
    });

    expect(size).to.eql(ENTRY1.size + ENTRY2.size + ENTRY3.size);
    expect(count).to.eql(3);
    expect(manifestEntries).to.deep.equal([{
      url: prefix + ENTRY1.file,
      revision: ENTRY1.hash,
    }, {
      url: prefix + ENTRY2.file,
      revision: ENTRY2.hash,
    }, {
      url: prefix + ENTRY3.file,
      revision: ENTRY3.hash,
    }]);
  });

  it(`should use custom manifestTransforms`, function() {
    const prefix1 = 'prefix1/';
    const prefix2 = 'prefix2/';

    const warning1 = 'test warning 1';
    const warning2 = 'test warning 1';

    const transform1 = (files) => {
      const manifest = files.map((file) => {
        file.url = prefix1 + file.url;
        return file;
      });
      return {manifest, warnings: [warning1]};
    };
    const transform2 = (files) => {
      const manifest = files.map((file) => {
        file.url = prefix2 + file.url;
        return file;
      });
      return {manifest, warnings: [warning2]};
    };

    const {size, count, manifestEntries, warnings} = filterFiles({
      fileDetails: FILE_DETAILS,
      manifestTransforms: [transform1, transform2],
    });

    expect(warnings).to.eql([warning1, warning2]);
    expect(size).to.eql(ENTRY1.size + ENTRY2.size + ENTRY3.size);
    expect(count).to.eql(3);
    expect(manifestEntries).to.deep.equal([{
      url: prefix2 + prefix1 + ENTRY1.file,
      revision: ENTRY1.hash,
    }, {
      url: prefix2 + prefix1 + ENTRY2.file,
      revision: ENTRY2.hash,
    }, {
      url: prefix2 + prefix1 + ENTRY3.file,
      revision: ENTRY3.hash,
    }]);
  });
});

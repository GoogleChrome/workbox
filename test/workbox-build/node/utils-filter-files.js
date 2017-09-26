const constants = require('../../../packages/workbox-build/src/lib/constants');
const errors = require('../../../packages/workbox-build/src/lib/errors');
const expect = require('chai').expect;
const filterFiles = require('../../../packages/workbox-build/src/lib/utils/filter-files');

require('chai').should();

describe(`src/lib/utils/filter-files.js`, function() {
  it(`should filter out files above maximum size`, function() {
    const goodFiles = [
      {
        file: 'ok.txt',
        size: 1234,
        hash: 'example-hash',
      },
      {
        file: 'ok-2.txt',
        size: constants.maximumFileSize,
        hash: 'example-hash-2',
      },
    ];

    const badFile = {
      file: 'not-ok.txt',
      size: constants.maximumFileSize + 1,
      hash: 'example-hash',
    };

    const allFiles = goodFiles.concat(badFile);

    const manifestEntries = filterFiles(allFiles, []);

    manifestEntries.length.should.equal(goodFiles.length);

    manifestEntries.forEach((manifestEntry) => {
      let matchingGoodFile = null;
      goodFiles.forEach((goodFile) => {
        if (`${goodFile.file}` === manifestEntry.url) {
          matchingGoodFile = goodFile;
        }
      });
      if (!matchingGoodFile) {
        throw new Error(`Unable to find matching file for manifest entry: ${manifestEntry}`);
      }

      manifestEntry.url.should.equal(`${matchingGoodFile.file}`);
      manifestEntry.revision.should.equal(matchingGoodFile.hash);
    });
  });

  it(`should throw an error when a bad manifestTransforms value is used`, function() {
    expect(
      () => filterFiles([], {manifestTransforms: () => {}})
    ).to.throw(errors['bad-manifest-transforms']);
  });

  it(`should use valid manifestTransforms`, function() {
    const files = [
      {
        file: 'func1',
        size: 1,
        hash: 'func1-hash',
      }, {
        file: 'func2',
        size: 2,
        hash: 'func2-hash',
      },
    ];
    const func1 = (files) => {
      return files.map((file) => {
        file.url = `func1-prefix/${file.url}`;
        return file;
      });
    };
    const func2 = (files) => {
      return files.map((file) => {
        file.url = `func2-prefix/${file.url}`;
        return file;
      });
    };
    const filteredFiles = filterFiles(files, {manifestTransforms: [func1, func2]});
    expect(filteredFiles).to.deep.equal([
      {
        url: 'func2-prefix/func1-prefix/func1',
        revision: 'func1-hash',
      }, {
        url: 'func2-prefix/func1-prefix/func2',
      revision: 'func2-hash',
      },
    ]);
  });
});

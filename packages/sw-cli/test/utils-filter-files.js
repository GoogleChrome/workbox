const cliHelper = require('./helpers/cli-test-helper');
const constants = require('../src/lib/constants');
const filterFiles = require('../src/lib/utils/filter-files');

require('chai').should();

describe('src/lib/utils/filter-files.js', function() {
  afterEach(function() {
    cliHelper.endLogCapture();
  });

  it('should filter out files above maximum size', function() {
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

    cliHelper.startLogCapture();
    const manifestEntries = filterFiles(allFiles, []);

    const captured = cliHelper.endLogCapture();
    captured.consoleLogs.length.should.equal(0);
    captured.consoleWarns.length.should.not.equal(0);
    captured.consoleErrors.length.should.equal(0);

    manifestEntries.length.should.equal(goodFiles.length);

    manifestEntries.forEach((manifestEntry) => {
      let matchingGoodFile = null;
      goodFiles.forEach((goodFile) => {
        if (`/${goodFile.file}` === manifestEntry.url) {
          matchingGoodFile = goodFile;
        }
      });
      if (!matchingGoodFile) {
        console.warn(manifestEntry);
        throw new Error('Unable to find matching file for manifest entry: ');
      }

      manifestEntry.url.should.equal(`/${matchingGoodFile.file}`);
      manifestEntry.revision.should.equal(matchingGoodFile.hash);
    });
  });
});

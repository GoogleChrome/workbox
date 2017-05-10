const generateGlobPattern = require('../../src/lib/utils/generate-glob-pattern');
const errors = require('../../src/lib/errors');

require('chai').should();

describe('src/lib/utils/generate-glob-pattern.js', function() {
  it('should handle a single file extension', function() {
    const globPattern = generateGlobPattern(['txt']);
    globPattern.should.equal('**/*.txt');
  });

  it('should handle a multiple file extensions', function() {
    const globPattern = generateGlobPattern(['txt', 'js']);
    globPattern.should.equal('**/*.{txt,js}');
  });

  it('should be able to handle a bad fileExtentionsToCache iput', function() {
    const badInput = [
      undefined,
      null,
      '',
      {},
      [],
      [null],
      [true],
      [false],
      [{}],
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        try {
          generateGlobPattern(input);
          throw new Error('Expected to throw error.');
        } catch(err) {
          if (err.message !== errors['no-file-extensions-to-cache']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        }
      });
    }, Promise.resolve());
  });

  // fileExtensionsToCache - Add warning if the extension name has a '.' as
  //                         first character
  it('should be able to handle a bad file extension', function() {
    try {
      generateGlobPattern(['.example']);
      throw new Error('Expected to throw error.');
    } catch(err) {
      if (err.message !== errors['no-file-extensions-to-cache']) {
        throw new Error('Unexpected error: ' + err.message);
      }
    }
  });
});

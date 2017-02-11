const generateGlobPattern = require('../src/lib/utils/generate-glob-pattern');

require('chai').should();

describe('src/lib/utils/generate-glob-pattern.js', function() {
  it('should handle a single file extension', function() {
    const globPattern = generateGlobPattern('.', ['txt']);
    globPattern.should.equal('**/*.txt');
  });

  it('should handle a multiple file extensions', function() {
    const globPattern = generateGlobPattern('.', ['txt', 'js']);
    globPattern.should.equal('**/*.{txt,js}');
  });
});

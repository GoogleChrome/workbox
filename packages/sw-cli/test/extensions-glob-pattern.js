const SWCli = require('../src/cli/index');

require('chai').should();

describe('Test File Extensions to Glob Pattern', function() {
  it('should handle a single file extension', function() {
    const cli = new SWCli();
    const globPattern = cli._generateGlobPatten('.', ['txt']);
    globPattern.should.equal('**/*.txt');
  });

  it('should handle a multiple file extensions', function() {
    const cli = new SWCli();
    const globPattern = cli._generateGlobPatten('.', ['txt', 'js']);
    globPattern.should.equal('**/*.{txt,js}');
  });
});

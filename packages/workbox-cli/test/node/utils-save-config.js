const proxyquire = require('proxyquire');
const errors = require('../../src/lib/errors');

describe('Test Save Config', function() {
  it('should be able to handle writeFile error', function() {
    const saveConfig = proxyquire('../../src/lib/utils/save-config', {
      fs: {
        writeFile: (path, content, cb) => {
          cb(new Error('Injected Error'));
        },
      },
    });
    return saveConfig({example: 'Hi.'})
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      if (err.message.indexOf(errors['config-write-failure']) !== 0) {
        throw new Error('Unexpected error thrown.');
      }
    });
  });

  it('should resolve on writing file', function() {
    const saveConfig = proxyquire('../../src/lib/utils/save-config', {
      fs: {
        writeFile: (path, content, cb) => {
          cb(null);
        },
      },
    });
    return saveConfig({example: 'Hi.'});
  });
});

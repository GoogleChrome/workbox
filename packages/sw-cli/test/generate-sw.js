const swCLI = require('../src/index');
const errors = require('../src/lib/errors');

describe('Test generateSW()', function() {
  // Bad inputs (undefined, null, string, array, boolean)
  it('should be able to handle non-object input', function() {
    const badInput = [
      undefined,
      null,
      '',
      [],
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        return swCLI.generateSW(input)
        .catch((err) => {
          if (err.message !== errors['invalid-generate-sw-input']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  // rootDirectory - non string - undefined, null, array, boolean,  object
  // rootDirectory - doesn't exist

  // fileExtentionsToCache - non array, undefined, null, boolean, string,  object
  // fileExtentionsToCache - empty array
  // fileExtensionsToCache - Add warning if the extension name as a '.' as
  //                         first character

  // swName - non string, undefined, null, boolean, array, object
  // swName - empty string

  // excludeFiles - non array, undefined, null, boolea, string, object

  // Success.........................................................

  // rootDirectory - dot
  // rootDirectory - valid nested folder

  // fileExtensionsToCache - single item array
  // fileExtensionsToCache - multiple item with multiple dots

  // swName - multiple dots in name
  // swName - nested path

  // excludeFiles - non existant file
  // excludeFiles - empty array
});

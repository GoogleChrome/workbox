const path = require('path');
const glob = require('glob');

describe(`[all] Test Exports of Each Module`, function() {
  const testPrivateExports = (packagePath, allExports, type) => {
    const privateFiles = glob.sync(path.posix.join(packagePath, '_private', '*.mjs'));
    if (privateFiles.length > 0 && !allExports._private) {
      throw new Error(`No _private field exported in ${packagePath} - ${type} exports`);
    }
    privateFiles.forEach((privateFilePath) => {
      const expectedExportName = path.basename(privateFilePath, path.extname(privateFilePath));
      if (!allExports._private[expectedExportName]) {
        throw new Error(`Unable to find export for workbox.*._private.${expectedExportName}`);
      }
    });

    const nestedPrivateFiles = glob.sync(path.posix.join(packagePath, '_private', '*', '*'));
    if (nestedPrivateFiles.length > 0) {
      throw new Error('Nested private files are not supported');
    }
  };

  it(`should expose all of the private modules on module`, async function() {
    const packageFiles = glob.sync('packages/*/package.json', {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: path.join(__dirname, '..', '..', '..'),
      absolute: true,
    });

    // Find the version in each file.
    for (let packageJSONPath of packageFiles) {
      // skip non-browser modules
      const pkg = require(packageJSONPath);
      if (pkg.workbox.packageType !== 'browser') {
        return;
      }

      const packagePath = path.dirname(packageJSONPath);
      const moduleExports = await import(path.join(packagePath, 'index.mjs'));
      testPrivateExports(packagePath, moduleExports, 'index.mjs');
    }
  });

  it(`should expose all of the private modules on browser bundle`, async function() {
    const packagePath = path.join(__dirname, '..', '..', '..', 'packages', 'workbox-core');
    const browserExports = await import(path.join(packagePath, 'browser.mjs'));

    // @std/esm will include the 'default' property regardless of the module.
    // We want EVERYTHING to be on the default export as Rollup will remove
    // this on the final build.
    testPrivateExports(packagePath, browserExports.default, 'browser.mjs');
  });
});

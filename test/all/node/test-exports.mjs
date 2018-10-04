const path = require('path');
const glob = require('glob');

describe(`[all] Test Exports of Each Module`, function() {
  // Reading files is slow.
  this.timeout(5 * 1000);

  const testPublicExports = (packagePath, allExports, type) => {
    const publicFiles = glob.sync(path.posix.join(packagePath, '*.mjs'));
    publicFiles.forEach((publicFilePath) => {
      const expectedExportName = path.basename(publicFilePath, path.extname(publicFilePath));
      switch (expectedExportName) {
        case 'index':
        case 'browser':
        case '_public':
        case '_default':
        case '_version':
        case '_types':
        // These are special files and don't need to be exported.
          break;
        default:
          if (!(expectedExportName in allExports)) {
            throw new Error(`Unable to find export for workbox.*.${expectedExportName} in ${packagePath}`);
          }
          break;
      }
    });
  };

  it(`should expose all of the top level files on module`, async function() {
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
        continue;
      }

      const packagePath = path.dirname(packageJSONPath);
      const moduleExports = await import(path.join(packagePath, 'index.mjs'));
      testPublicExports(packagePath, moduleExports, 'index.mjs');
    }
  });

  it(`should expose all of the top level files on module`, async function() {
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
        continue;
      }

      const packagePath = path.dirname(packageJSONPath);
      let browserExports = await import(path.join(packagePath, 'browser.mjs'));
      // @std/esm will include the 'default' property regardless of the module.
      // We want EVERYTHING to be on the default export as Rollup will remove
      // this on the final build.
      if (browserExports.default) {
        browserExports = browserExports.default;
      }
      testPublicExports(packagePath, browserExports, 'browser.mjs');
    }
  });
});

// TODO Test public tests

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');
const camelCase = require('camelcase');
const fs = require('fs-extra');
const glob = require('glob');
const ol = require('common-tags').oneLine;
const upath = require('path');

const {getPackages} = require('../../../gulp-tasks/utils/get-packages');
const constants = require('../../../gulp-tasks/utils/constants');
const pkgPathToName = require('../../../gulp-tasks/utils/pkg-path-to-name');

describe(`[all] Test package.json`, function () {
  it(`should expose correct main, browser and module fields`, function () {
    const packageFiles = glob.sync('packages/**/package.json', {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: upath.join(__dirname, '..', '..', '..'),
      absolute: true,
    });
    packageFiles.forEach((packagePath) => {
      const pkg = require(packagePath);
      switch (pkg.workbox.packageType) {
        case 'sw': {
          const propertiesToCheck = ['main', 'module'];

          propertiesToCheck.forEach((propertyName) => {
            if (!pkg[propertyName]) {
              throw new Error(
                `The package.json at '${upath.relative(
                  process.cwd(),
                  packagePath,
                )}' isn't exposing a '${propertyName}' property`,
              );
            }

            const fullPath = upath.join(
              upath.dirname(packagePath),
              pkg[propertyName],
            );
            if (!fs.existsSync(fullPath)) {
              throw new Error(
                `${upath.relative(
                  process.cwd(),
                  packagePath,
                )} has an invalid '${propertyName}' property: '${
                  pkg[propertyName]
                }'`,
              );
            }
          });
          break;
        }
        case 'window': {
          break;
        }
        case 'node': {
          break;
        }
        case 'node_ts': {
          break;
        }
        default:
          throw new Error(
            `Unknown package.json workbox.packageType: '${
              pkg.workbox.packageType
            }' in ${upath.relative(process.cwd(), packagePath)}`,
          );
      }
    });
  });

  it(`should import _version.mjs in each .mjs file`, function () {
    // Find directories with package.json file
    const packageFiles = glob.sync('packages/*/package.json', {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: upath.join(__dirname, '..', '..', '..'),
      absolute: true,
    });
    packageFiles.forEach((packagePath) => {
      // skip non-sw modules
      const pkg = require(packagePath);
      if (pkg.workbox.packageType !== 'sw') {
        return;
      }

      // TODO(philipwalton): remove this once all packages are converted to
      // typescript or typescript adds `.mjs` support.
      const ext = 'types' in pkg ? 'js' : 'mjs';

      // Glob for all js and mjs files in the package
      const packageName = pkgPathToName(upath.dirname(packagePath));
      const packageFiles = glob.sync(`packages/${packageName}/**/*.${ext}`, {
        ignore: [
          'packages/*/node_modules/**/*',
          `packages/*/_version.${ext}`,
          `packages/*/${constants.PACKAGE_BUILD_DIRNAME}/**/*`,
        ],
        cwd: upath.join(__dirname, '..', '..', '..'),
        absolute: true,
      });

      const importRegex = new RegExp(`import\\s+'[./]+_version\\.${ext}';`);

      // Find the version in each file.
      packageFiles.forEach((filePath) => {
        const fileContents = fs.readFileSync(filePath).toString();
        const results = importRegex.exec(fileContents);
        if (!results) {
          throw new Error(
            `Unable to find the workbox version in '${upath.relative(
              process.cwd(),
              filePath,
            )}'`,
          );
        }
      });
    });
  });

  it(`should contain the file version`, function () {
    const versionRegex = /['|"]workbox:((?:[^:'"]*|:)*)['|"]/;

    // Find directories with package.json file
    const packageFiles = glob.sync('packages/*/package.json', {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: upath.join(__dirname, '..', '..', '..'),
      absolute: true,
    });
    packageFiles.forEach((packagePath) => {
      // skip non-browser modules
      const pkg = require(packagePath);
      if (pkg.workbox.packageType !== 'sw') {
        return;
      }

      // Glob for all js and mjs files in the package
      const packageName = pkgPathToName(upath.dirname(packagePath));
      const packageFiles = glob.sync(
        `packages/${packageName}/${constants.PACKAGE_BUILD_DIRNAME}/**/*.{js,mjs}`,
        {
          ignore: ['packages/*/node_modules/**/*'],
          cwd: upath.join(__dirname, '..', '..', '..'),
          absolute: true,
        },
      );

      // Find the version in each file.
      packageFiles.forEach((filePath) => {
        const fileContents = fs.readFileSync(filePath).toString();
        const results = versionRegex.exec(fileContents);
        if (!results) {
          throw new Error(
            `Unable to find the workbox version in '${upath.relative(
              process.cwd(),
              filePath,
            )}'`,
          );
        }

        const metadata = results[1].split(':');
        try {
          expect(metadata[0]).to.equal(pkg.name.replace('workbox-', ''));
          expect(metadata[1]).to.equal(pkg.version);
        } catch (err) {
          throw new Error(`Invalid file version ${filePath}: ${metadata}`);
        }
      });
    });
  });

  it(`should have correct details in _version.mjs`, function () {
    const versionRegex = /['|"]workbox:((?:[^:'"]*|:)*)['|"]/;

    // Find directories with package.json file
    const packageFiles = glob.sync('packages/*/package.json', {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: upath.join(__dirname, '..', '..', '..'),
      absolute: true,
    });
    packageFiles.forEach((packagePath) => {
      // skip non-browser modules
      const pkg = require(packagePath);
      if (pkg.workbox.packageType !== 'sw') {
        return;
      }

      // TODO(philipwalton): remove this once all packages are converted to
      // typescript or typescript adds `.mjs` support.
      const ext = 'types' in pkg ? 'js' : 'mjs';

      const packageName = pkgPathToName(upath.dirname(packagePath));
      const versionFiles = glob.sync(
        `packages/${packageName}/_version.${ext}`,
        {
          ignore: ['packages/*/node_modules/**/*'],
          cwd: upath.join(__dirname, '..', '..', '..'),
          absolute: true,
        },
      );

      // Find the version in each file.
      versionFiles.forEach((filePath) => {
        const fileContents = fs.readFileSync(filePath).toString();
        const results = versionRegex.exec(fileContents);
        if (!results) {
          throw new Error(
            `Unable to find the workbox version in '${upath.relative(
              process.cwd(),
              filePath,
            )}'`,
          );
        }

        const metadata = results[1].split(':');
        try {
          expect(metadata[0]).to.equal(pkg.name.replace('workbox-', ''));
          expect(metadata[1]).to.equal(pkg.version);
        } catch (err) {
          throw new Error(`Invalid file version ${filePath}: ${metadata}`);
        }
      });
    });
  });

  it(`should only use a namespace that matches its package name`, function () {
    const pkgs = getPackages({type: 'sw'});

    for (const pkg of pkgs) {
      // These rules don't apply to workbox-sw
      if (pkg.name === 'workbox-sw') continue;

      // Remove the `workbox-` prefix.
      const pkgNameSuffix = pkg.name.replace(/^workbox-/, '');

      // Remvoe the `workbox.` prefix.
      const pkgNamespaceSuffix = pkg.workbox.browserNamespace.replace(
        /^workbox\./,
        '',
      );

      if (camelCase(pkgNameSuffix) !== pkgNamespaceSuffix) {
        throw new Error(ol`Invalid browser namespace:
            ${pkg.workbox.browserNamespace}. The browser namespace must include
            the package name camelCased (${camelCase(pkgNameSuffix)}).`);
      }
    }
  });
});

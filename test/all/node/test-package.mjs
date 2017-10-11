import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';
import {expect} from 'chai';

import constants from '../../../gulp-tasks/utils/constants';
import pkgPathToName from '../../../gulp-tasks/utils/pkg-path-to-name';

describe(`[all] Test package.json`, function() {
  it(`should expose correct main, browser and module fields`, function() {
    const packageFiles = glob.sync('packages/**/package.json', {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: path.join(__dirname, '..', '..', '..'),
      absolute: true,
    });
    packageFiles.forEach((packagePath) => {
      const pkg = require(packagePath);
      switch (pkg.workbox.packageType) {
        case 'browser': {
          const propertiesToCheck = [
            'main',
            'module',
            'browser',
          ];

          propertiesToCheck.forEach((propertyName) => {
            if (!pkg[propertyName]) {
              throw new Error(`The package.json at '${path.relative(process.cwd(), packagePath)}' isn't exposing a '${propertyName}' property`);
            }
            if (path.dirname(pkg[propertyName]).indexOf(constants.PACKAGE_BUILD_DIRNAME) !== 0) {
              throw new Error(`The property '${propertyName}' for '${path.relative(process.cwd(), packagePath)}' isn't referencing a file in the '${constants.PACKAGE_BUILD_DIRNAME}' directory: '${pkg[propertyName]}'`);
            }

            const fullPath = path.join(path.dirname(packagePath), pkg[propertyName]);
            if (!fs.existsSync(fullPath)) {
              throw new Error(`${path.relative(process.cwd(), packagePath)} has an invalid '${propertyName}' property: '${pkg[propertyName]}'`);
            }
          });
          break;
        }
        case 'node': {
          break;
        }
        default:
          throw new Error(`Unknown package.json workbox.packageType: '${pkg.workbox.packageType}' in ${path.relative(process.cwd(), packagePath)}`);
      }
    });
  });

  it(`should contain the file version`, function() {
    const versionRegex = /['|"]workbox:((?:[^:'"]*|:)*)['|"]/;
    const packageFiles = glob.sync('packages/*/package.json', {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: path.join(__dirname, '..', '..', '..'),
      absolute: true,
    });
    packageFiles.forEach((packagePath) => {
      const pkg = require(packagePath);
      if (pkg.workbox.packageType !== 'browser') {
        return;
      }

      const packageName = pkgPathToName(path.dirname(packagePath));
      const packageFiles = glob.sync(`packages/${packageName}/${constants.PACKAGE_BUILD_DIRNAME}/**/*.{js,mjs}`, {
        cwd: path.join(__dirname, '..', '..', '..'),
        absolute: true,
      });
      packageFiles.forEach((filePath) => {
        const fileContents = fs.readFileSync(filePath).toString();
        const results = versionRegex.exec(fileContents);
        if (!results) {
          throw new Error(`Unable to find the workbox version in '${path.relative(process.cwd(), filePath)}'`);
        }

        const metadata = results[1].split(':');
        expect(metadata[0]).to.equal(pkg.name);
        expect(metadata[1]).to.equal(pkg.version);
      });
    });
  });
});

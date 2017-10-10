import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';

import constants from '../../../gulp-tasks/utils/constants';

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

            const fullPath = path.join(path.dirname(packagePath, pkg[propertyName]));
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
});

import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';
import {oneLine} from 'common-tags';
import logHelper from '../../../infra/utils/log-helper';
import constants from '../../../gulp-tasks/utils/constants';

describe('[all] Check for hasOwnProperty', function() {
  it(`should not have build files with hasOwnProperty`, function() {
    const buildFiles = glob.sync(`packages/*/${constants.PACKAGE_BUILD_DIRNAME}/${constants.BROWSER_BUILD_DIRNAME}/*.js`, {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: path.join(__dirname, '..', '..', '..'),
      absolute: true,
    });

    const invalidFiles = [];
    buildFiles.forEach((filePath) => {
      const fileContents = fs.readFileSync(filePath).toString();
      if (fileContents.indexOf(`.hasOwnProperty('default')`) !== -1) {
        invalidFiles.push(filePath);
      }
    });

    if (invalidFiles.length > 0) {
      logHelper.error(
        `Files with 'hasOwnProperty('default')' in them\n`,
        JSON.stringify(invalidFiles, null, 2));
      throw new Error(oneLine`
        Found ${invalidFiles.length} files with 'hasOwnProperty('default')'
        in the final build. Please convert these to named exports to be friendly
        to Rollup.
      `);
    }
  });
});

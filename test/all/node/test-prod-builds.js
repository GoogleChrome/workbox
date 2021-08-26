/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {oneLine} = require('common-tags');
const constants = require('../../../gulp-tasks/utils/constants');
const fse = require('fs-extra');
const glob = require('glob');
const logHelper = require('../../../infra/utils/log-helper');
const path = require('path');

describe(`[all] prod builds`, function () {
  const buildFiles = glob.sync(
    `packages/*/${constants.PACKAGE_BUILD_DIRNAME}/*.prod.js`,
    {
      ignore: ['packages/*/node_modules/**/*'],
      cwd: path.join(__dirname, '..', '..', '..'),
      absolute: true,
    },
  );

  it(`should not have files with "console" or "%cworwbox"`, function () {
    const invalidFiles = [];
    buildFiles.forEach((filePath) => {
      const fileContents = fse.readFileSync(filePath).toString();
      if (
        (fileContents.indexOf(`console`) > -1 &&
          // See https://github.com/GoogleChrome/workbox/issues/2259
          !filePath.includes('workbox-precaching')) ||
        fileContents.indexOf(`%cworkbox`) > -1
      ) {
        invalidFiles.push(filePath);
      }
    });

    if (invalidFiles.length > 0) {
      logHelper.error(
        `Files with 'console' in them\n`,
        JSON.stringify(invalidFiles, null, 2),
      );
      throw new Error(oneLine`
        Found ${invalidFiles.length} files with "console" or "%cworkbox" in
        the final build. Please ensure all 'logger' calls are wrapped in a
        "if (process.env.NODE_ENV !== 'production') {...}" conditional.
      `);
    }
  });

  it(`should not have files with hasOwnProperty`, function () {
    const invalidFiles = [];
    buildFiles.forEach((filePath) => {
      const fileContents = fse.readFileSync(filePath).toString();
      if (fileContents.indexOf(`.hasOwnProperty('default')`) !== -1) {
        invalidFiles.push(filePath);
      }
    });

    if (invalidFiles.length > 0) {
      logHelper.error(
        `Files with 'hasOwnProperty('default')' in them\n`,
        JSON.stringify(invalidFiles, null, 2),
      );
      throw new Error(oneLine`
        Found ${invalidFiles.length} files with "hasOwnProperty('default')"
        in the final build. Please convert these to named exports to be friendly
        to Rollup.
      `);
    }
  });
});

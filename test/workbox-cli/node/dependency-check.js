/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const depcheck = require('depcheck');
const upath = require('upath');

describe(`[workbox-cli] package.json`, function () {
  it(`should have required dependencies`, function () {
    return new Promise((resolve, reject) => {
      depcheck(
        upath.join(__dirname, '..', '..', '..', 'packages', 'workbox-cli'),
        {
          ignoreDirs: ['build'],
          ignoreMatches: ['@babel/runtime'],
        },
        (unusedDeps) => {
          if (unusedDeps.dependencies.length > 0) {
            return reject(
              new Error(
                `Unused dependencies defined in package.json: ${JSON.stringify(
                  unusedDeps.dependencies,
                )}`,
              ),
            );
          }

          if (unusedDeps.devDependencies.length > 0) {
            return reject(
              new Error(
                `Unused dependencies defined in package.json: ${JSON.stringify(
                  unusedDeps.devDependencies,
                )}`,
              ),
            );
          }

          if (Object.keys(unusedDeps.missing).length > 0) {
            return reject(
              new Error(
                `Dependencies missing from package.json: ${JSON.stringify(
                  unusedDeps.missing,
                )}`,
              ),
            );
          }

          resolve();
        },
      );
    });
  });

  it(`should have no devDependencies`, function () {
    const pkg = require('../../../packages/workbox-cli/package.json');
    if (pkg.devDependencies && Object.keys(pkg.devDependencies) > 0) {
      throw new Error('There should not be devDependencies in this module.');
    }
  });
});

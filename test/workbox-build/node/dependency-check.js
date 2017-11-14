const path = require('path');
const depcheck = require('depcheck');

describe(`[workbox-build] Test Dependencies`, function() {
  it(`should have required dependencies`, function() {
    return new Promise((resolve, reject) => {
      depcheck(path.join(__dirname, '..', '..', '..', 'packages', 'workbox-build'), {
      ignoreDirs: [
        'test',
        'build',
        'demo',
      ],
      ignoreMatches: [
        'babel-runtime',
        'workbox-cache-expiration',
        'workbox-core',
        'workbox-precaching',
        'workbox-routing',
        'workbox-strategies',
        'workbox-sw',
      ],
    }, (unusedDeps) => {
      if (unusedDeps.dependencies.length > 0) {
        return reject(new Error(`Unused dependencies defined in package.json: ${JSON.stringify(unusedDeps.dependencies)}`));
      }

      if (unusedDeps.devDependencies.length > 0) {
        return reject(new Error(`Unused dependencies defined in package.json: ${JSON.stringify(unusedDeps.devDependencies)}`));
      }

      if (Object.keys(unusedDeps.missing).length > 0) {
        return reject(new Error(`Dependencies missing from package.json: ${JSON.stringify(unusedDeps.missing)}`));
      }

      resolve();
    });
    });
  });

  it(`should have no devDependencies`, function() {
    // This test exists because there have been a number of situations where
    // dependencies have been used from the top level project and NOT from
    // this module itself. So dependencies are checked above and devDependencies
    // can be put in top level.
    const pkg = require('../../../packages/workbox-build/package.json');
    if (pkg.devDependencies && Object.keys(pkg.devDependencies) > 0) {
      throw new Error('No devDependencies in this module.');
    }
  });
});

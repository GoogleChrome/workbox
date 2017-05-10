const path = require('path');
const depcheck = require('depcheck');

describe('Test Dependencies', function() {
  it('should have required dependencies', function() {
    return new Promise((resolve, reject) => {
      depcheck(path.join(__dirname, '..', '..'), {
      ignoreDirs: [
        'test',
        'build',
        'demo',
      ],
      ignoreMatches: [
        'sw-lib',
      ],
    }, (unusedDeps) => {
      if (unusedDeps.dependencies.length > 0) {
        console.log(unusedDeps.dependencies);
        return reject(new Error('Unused dependencies defined in package.json'));
      }

      if (unusedDeps.devDependencies.length > 0) {
        console.log(unusedDeps.dependencies);
        return reject(new Error('Unused devDependencies defined in package.json'));
      }

      if (Object.keys(unusedDeps.missing).length > 0) {
        console.log(unusedDeps.missing);
        return reject(new Error('Dependencies missing from package.json'));
      }

      resolve();
    });
    });
  });

  it('should have no devDependencies', function() {
    // This test exists because there have been a number of situations where
    // dependencies have been used from the top level project and NOT from
    // this module itself. So dependencies are checked above and devDependencies
    // can be put in top level.
    const pkg = require('../../package.json');
    if (pkg.devDependencies && Object.keys(pkg.devDependencies) > 0) {
      throw new Error('No devDependencies in this module.');
    }
  });
});

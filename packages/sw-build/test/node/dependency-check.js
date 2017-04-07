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
        return reject(new Error('Dependencies missingfrom package.json'));
      }

      resolve();
    });
    });
  });
});

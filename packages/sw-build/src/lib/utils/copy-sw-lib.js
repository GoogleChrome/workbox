const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const errors = require('../errors');

module.exports = (outputDirectory) => {
  const swlibModuleBuildPath = path.dirname(require.resolve('sw-lib'));
  const swlibPkg = require(
    path.join(swlibModuleBuildPath, '..', 'package.json')
  );

  const swlibOutputPath = path.join(outputDirectory,
    `sw-lib.v${swlibPkg.version}.min.js`);
  return new Promise((resolve) => {
    fs.unlink(swlibOutputPath, (err) => {
      resolve();
    });
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      const swlibBuiltPath = path.join(swlibModuleBuildPath, 'sw-lib.min.js');

      mkdirp.sync(outputDirectory);

      const stream = fs.createReadStream(swlibBuiltPath)
        .pipe(fs.createWriteStream(swlibOutputPath));
      stream.on('error', function(err) {
        reject(new Error(errors['unable-to-copy-sw-lib'] +
          ` '${err.message}'`));
      });
      stream.on('finish', function() {
        resolve(swlibOutputPath);
      });
    });
  });
};

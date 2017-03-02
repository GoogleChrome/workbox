const path = require('path');
const fs = require('fs');

const errors = require('../errors');

module.exports = (rootDirectory) => {
  const swlibModulePath = path.join(__dirname, '..', '..', '..', 'node_modules',
    'sw-lib');
  const swlibPkg = require(path.join(swlibModulePath, 'package.json'));

  const swlibOutputPath = path.join(rootDirectory,
    `sw-lib.v${swlibPkg.version}.min.js`);
  return new Promise((resolve) => {
    fs.unlink(swlibOutputPath, (err) => {
      resolve();
    });
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      const swlibBuiltPath = path.join(swlibModulePath, 'build',
        'sw-lib.min.js');

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

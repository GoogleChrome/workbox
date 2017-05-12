const errors = require('../errors');
const fse = require('fs-extra');
const path = require('path');

module.exports = (outputDirectory) => {
  const swlibSrcPath = require.resolve('workbox-sw');
  const swlibDestPath = path.join(outputDirectory, path.basename(swlibSrcPath));
  return fse.copy(swlibSrcPath, swlibDestPath)
    .then(() => swlibDestPath)
    .catch((error) => {
      throw Error(`${errors['unable-to-copy-workbox-sw']} ${error}`);
    });
};

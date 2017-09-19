'use strict';

const errors = require('../errors');
const fse = require('fs-extra');
const path = require('path');

module.exports = (outputDirectory) => {
  const workboxSWSrcPath = require.resolve('workbox-sw');
  const workboxSWDestPath = path.join(outputDirectory,
    path.basename(workboxSWSrcPath));
  return Promise.all([
      fse.copy(workboxSWSrcPath, workboxSWDestPath),
      fse.copy(`${workboxSWSrcPath}.map`, `${workboxSWDestPath}.map`),
    ])
    .then(() => workboxSWDestPath)
    .catch((error) => {
      throw Error(`${errors['unable-to-copy-workbox-sw']} ${error}`);
    });
};

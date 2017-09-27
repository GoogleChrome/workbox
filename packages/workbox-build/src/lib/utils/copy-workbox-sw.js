const fse = require('fs-extra');
const path = require('path');

const errors = require('../errors');

module.exports = async (outputDirectory) => {
  const workboxSWSrcPath = require.resolve('workbox-sw');
  const workboxSWDestPath = path.join(outputDirectory,
    path.basename(workboxSWSrcPath));

  try {
    await Promise.all([
      fse.copy(workboxSWSrcPath, workboxSWDestPath),
      fse.copy(`${workboxSWSrcPath}.map`, `${workboxSWDestPath}.map`),
    ]);

    return workboxSWDestPath;
  } catch (error) {
    throw Error(`${errors['unable-to-copy-workbox-sw']} ${error}`);
  }
};

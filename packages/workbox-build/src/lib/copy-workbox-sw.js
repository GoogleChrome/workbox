const fse = require('fs-extra');
const path = require('path');

const errors = require('./errors');
const useBuildType = require('./use-build-type');

module.exports = async (destDirectory, buildType) => {
  const defaultWorkboxSourcePath = require.resolve('workbox-sw');
  // Replace the build type to get, e.g., the dev build, as needed.
  const workboxSWSrcPath = useBuildType(defaultWorkboxSourcePath, buildType);
  const workboxSWDestPath = path.join(destDirectory,
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

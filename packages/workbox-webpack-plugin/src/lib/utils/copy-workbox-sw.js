const path = require('path');
const {readFile} = require('./read-file');
const errors = require('workbox-build/src/lib/errors');

module.exports = (readFileFn) => {
  const workboxSWSrcPath = require.resolve('workbox-sw');
  return Promise.all([
      readFile(workboxSWSrcPath),
      readFile(`${workboxSWSrcPath}.map`),
    ])
    .then(([workboxSW, workboxSWMap]) => ({
      workboxSW,
      workboxSWMap,
      workboxSWName: path.basename(workboxSWSrcPath),
    }))
    .catch((error) => {
      throw Error(`${errors['unable-to-copy-workbox-sw']} ${error}`);
    });
};

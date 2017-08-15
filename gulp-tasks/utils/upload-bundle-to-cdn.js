const path = require('path');
const glob = require('glob');

const spawnPromiseWrapper = require('./spawn-promise-wrapper');

const PROJECT_ID = 'workbox-bab1f';
const BUCKET_NAME = 'workbox-cdn';

module.exports = (tagName, directoryToUpload) => {
  return spawnPromiseWrapper('gcloud', [
    'config', 'set', 'project', PROJECT_ID,
  ])
  .then(() => {
    const globPattern = path.posix.join(
      directoryToUpload, '*');
    const filePaths = glob.sync(globPattern, {
      absolute: true,
    });

    return filePaths.reduce((promiseChain, filePath) => {
      return promiseChain.then(() => {
        return spawnPromiseWrapper('gsutil', [
          'cp', `${filePath}`, `gs://${BUCKET_NAME}/${tagName}/`,
        ]);
      });
    }, Promise.resolve());
  })
  .then(() => {
    // Set public read on the storage bucket
    return spawnPromiseWrapper('gsutil', [
      'acl', 'set', '-r', 'public-read', `gs://${BUCKET_NAME}/${tagName}/`,
    ]);
  });
};

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const storage = require('@google-cloud/storage');

// const spawnPromiseWrapper = require('./spawn-promise-wrapper');

const PROJECT_ID = 'workbox-bab1f';
const BUCKET_NAME = 'workbox-cdn';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', '..',
  `workbox-cdn-service-account.json`);

class CDNHelper {
  constructor() {
    this._gcs = null;
  }

  getGCS() {
    if (!this._gcs) {
      throw new Error(oneLine`
        Google Cloud Storage instance not initialised.
        Call init() before any other function.
      `);
    }

    return this._gcs;
  }

  async init() {
    const access = fs.access(SERVICE_ACCOUNT_PATH);
    if (!access) {
      throw new Error(oneLine`
        Unable to find the service account file that is required to upload
        to the CDN.
        Please get the service account file and put it at the root of the
        workbox repo.

        File Path Tested: '${SERVICE_ACCOUNT_PATH}'.
      `);
    }

    this._gcs = storage({
      projectId: PROJECT_ID,
      keyFilename: SERVICE_ACCOUNT_PATH,
    });
  }

  async tagExists(tagName) {
    const gcs = this.getGCS();
    const bucket = gcs.bucket(BUCKET_NAME);
    const file = bucket.file(`${tagName}`);
    const exists = await file.exists();
    return exists[0];
  }

  async upload(tagName, directoryToUpload) {
    const gcs = this.getGCS();

    const globPattern = path.posix.join(directoryToUpload, '*');
    const filePaths = glob.sync(globPattern, {
      absolute: true,
    });

    const bucket = gcs.bucket(BUCKET_NAME);
    for (let filePath of filePaths) {
      await bucket.upload(filePath, {
        destination: `${tagName}/${path.basename(filePath)}`,
        public: true,
      });
    }
  }
}

module.exports = new CDNHelper();

/** module.exports = (tagName, directoryToUpload) => {
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
};**/

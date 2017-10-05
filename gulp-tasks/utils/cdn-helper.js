const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const storage = require('@google-cloud/storage');

const logHelper = require('../../infra/utils/log-helper');

const PROJECT_ID = 'workbox-bab1f';
const BUCKET_NAME = 'workbox-cdn';
const STORAGE_ORIGIN = 'https://storage.googleapis.com';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', '..',
  `workbox-9d39634504ad.json`);

const ERROR_SERVICE_ACCOUNT = oneLine`
  Unable to find the service account file that is required to upload
  to the CDN.
  Please get the service account file and put it at the root of the
  workbox repo.

  File Path Tested: '${SERVICE_ACCOUNT_PATH}'.
`;

class CDNHelper {
  constructor() {
    this._gcs = null;
  }

  _getReleaseTagPath(tagName) {
    return `releases/${tagName}`;
  }

  getGCS() {
    if (!this._gcs) {
      try {
        fs.access(SERVICE_ACCOUNT_PATH);
      } catch (err) {
        throw new Error(ERROR_SERVICE_ACCOUNT);
      }

      this._gcs = storage({
        projectId: PROJECT_ID,
        keyFilename: SERVICE_ACCOUNT_PATH,
      });
    }

    return this._gcs;
  }

  async tagExists(tagName) {
    const gcs = this.getGCS();
    try {
      const bucket = gcs.bucket(BUCKET_NAME);
      // bucket.file('some/path/').exists() doesn't seem to work
      // for nested directories. Instead we are checking if there are
      // files in the expected release directory.
      const response = await bucket.getFiles({
        prefix: `${this._getReleaseTagPath(tagName)}/`,
      });
      const files = response[0];
      return files.length > 0;
    } catch (err) {
      logHelper.error(err);
      throw err;
    }
  }

  async upload(tagName, directoryToUpload) {
    const gcs = this.getGCS();

    const globPattern = path.posix.join(directoryToUpload, '*');
    const filePaths = glob.sync(globPattern, {
      absolute: true,
    });

    const publicUrls = [];
    const bucket = gcs.bucket(BUCKET_NAME);
    for (let filePath of filePaths) {
      const destination =
        `${this._getReleaseTagPath(tagName)}/${path.basename(filePath)}`;
      await bucket.upload(filePath, {
        destination,
        public: true,
      });

      // const file = bucket.file(destination);
      // const response = await file.makePublic();
      // console.log(response);

      publicUrls.push(
        `${STORAGE_ORIGIN}/${BUCKET_NAME}/${destination}`
      );
    }
    return publicUrls;
  }
}

module.exports = new CDNHelper();

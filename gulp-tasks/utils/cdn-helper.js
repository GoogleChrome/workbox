const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const storage = require('@google-cloud/storage');

const PROJECT_ID = 'workbox-bab1f';
const BUCKET_NAME = 'workbox-cdn';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', '..',
  `workbox-03bfbbb402fa.json`);

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

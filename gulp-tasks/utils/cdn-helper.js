/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const glob = require('glob');
const path = require('path');
const {Storage} = require('@google-cloud/storage');

const cdnDetails = require('../../cdn-details.json');
const logHelper = require('../../infra/utils/log-helper');

const PROJECT_ID = 'workbox-bab1f';

class CDNHelper {
  constructor() {
    this._gcs = null;
  }

  _getReleaseTagPath(tagName) {
    return `${cdnDetails.releasesDir}/${tagName}`;
  }

  async getGCS() {
    if (!this._gcs) {
      // Run `gcloud auth application-default login` if needed.
      // See https://stackoverflow.com/a/42059661/385997
      this._gcs = new Storage({
        projectId: PROJECT_ID,
      });
    }

    return this._gcs;
  }

  async tagExists(tagName) {
    const gcs = await this.getGCS();
    try {
      const bucket = gcs.bucket(cdnDetails.bucketName);
      // bucket.file('some/path/').exists() doesn't seem to work
      // for nested directories. Instead we are checking if there are
      // files in the expected release directory.
      const [files] = await bucket.getFiles({
        prefix: `${this._getReleaseTagPath(tagName)}/`,
      });
      return files.length > 0;
    } catch (err) {
      logHelper.error(err);
      throw err;
    }
  }

  async upload(tagName, directoryToUpload) {
    const gcs = await this.getGCS();

    const filePaths = glob.sync(`${directoryToUpload}/*`, {
      absolute: true,
    });

    const publicUrls = [];
    const bucket = gcs.bucket(cdnDetails.bucketName);

    for (const filePath of filePaths) {
      const destination = `${this._getReleaseTagPath(tagName)}/${path.basename(
        filePath,
      )}`;

      try {
        await bucket.upload(filePath, {
          destination,
          gzip: true,
          public: true,
          resumable: false,
          metadata: {
            cacheControl: 'public, max-age=31536000',
          },
        });
      } catch (err) {
        logHelper.error(`Failed to upload file to GCS bucket: '${filePath}'`);
        throw err;
      }
      publicUrls.push(
        `${cdnDetails.origin}/${cdnDetails.bucketName}/${destination}`,
      );
    }

    return publicUrls;
  }
}

module.exports = new CDNHelper();

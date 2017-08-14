const gulp = require('gulp');
const semver = require('semver');
const remoteGitTags = require('remote-git-tags');

const spawnPromiseWrapper = require('./utils/spawn-promise-wrapper');

const PROJECT_ID = 'workbox-bab1f';
const BUCKET_NAME = 'workbox-cdn';

gulp.task('publish:lerna', () => {});

const uploadToCDN = (directoryToUpload, uploadDirectory) => {
  return spawnPromiseWrapper('gcloud', [
    'config', 'set', 'project', PROJECT_ID,
  ])
  .then(() => {
    return spawnPromiseWrapper('gsutil', [
      'cp', ``, `gs://${BUCKET_NAME}/${tag}/`,
    ]);
  });
};

const publishTagToCDN = (tag) => {
  // TODO: Download Tag

  // TODO: Upload tagged files to CDN

  return Promise.resolve();
};

gulp.task('publish:cdn', () => {
  const GIT_REPO = 'github.com/GoogleChrome/workbox';

  return remoteGitTags(GIT_REPO)
  .then((tags) => {
    const tagObject = {};
    tags.forEach((value, key) => {
      tagObject[key] = value;
    });
    return Object.keys(tagObject);
  })
  .then((tags) => {
    return tags.filter((tag) => semver.gt(tag, '3.0.0'));
  })
  .then((tagsToPublish) => {
    return tagsToPublish.reduce((promiseChain, tag) => {
      return promiseChain.then(() => {
        return publishTagToCDN(tag);
      });
    }, Promise.resolve());
  })
  .then(() => {
    // TODO: Remove this once v3 is launched.
    // This publishes 'v3.0.0-alpha' as a release
    uploadToCDN('', 'v3.0.0-alpha.0');
  });
});

gulp.task('publish', gulp.series([
  'build',
  'test',
  'publish:lerna',
  'publish:cdn',
]));

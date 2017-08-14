const gulp = require('gulp');

const spawnPromiseWrapper = require('./utils/spawn-promise-wrapper');
const remoteGitTags = require('remote-git-tags');

gulp.task('publish:lerna', () => {});

gulp.task('publish:cdn', () => {
  const PROJECT_ID = 'workbox-bab1f';
  const BUCKET_NAME = 'workbox-cdn';

  const GIT_REPO = 'github.com/GoogleChrome/workbox';

  return remoteGitTags(GIT_REPO)
  .then((tags) => {
    console.log('Tags: ', tags);
  })
  .then(() => {
    /** return spawnPromiseWrapper('gcloud', [
      'config', 'set', 'project', PROJECT_ID,
    ])**/
  })
  .then(() => {
    /** spawnPromiseWrapper('gsutil', [
      'cp', ``, `gs://${BUCKET_NAME}/${GIT_TAG}/`
    ]);**/
  });
});

gulp.task('publish', gulp.series([
  'build',
  'test',
  'publish:lerna',
  'publish:cdn',
]));

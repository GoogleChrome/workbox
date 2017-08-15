const gulp = require('gulp');
const GitHubApi = require('github');
const path = require('path');
const semver = require('semver');
const glob = require('glob');
const fs = require('fs-extra');
const TarGz = require('tar.gz');
const archiver = require('archiver');

const logHelper = require('./utils/log-helper');
const constants = require('./utils/constants');
const spawnPromiseWrapper = require('./utils/spawn-promise-wrapper');
const uploadBundleToCDN = require('./utils/upload-bundle-to-cdn');

const GITHUB_OWNER = 'GoogleChrome';
const GITHUB_REPO = 'workbox';

const BUILD_PATH = path.join(__dirname, '..', 'github-releases');

const github = new GitHubApi();

github.authenticate({
  type: 'token',
  token: process.env.GITHUB_TOKEN,
});

const downloadGitCommit = async (tagName) => {
  logHelper.log(`Clone Git repo for tag: '${tagName}'.`);
  const tempPath = path.join(BUILD_PATH, tagName, 'source-code');
  const params = [
    'clone',
    '--branch', tagName,
    '--depth', '1',
    `http://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git`,
    tempPath,
  ];

  await spawnPromiseWrapper('git', params);

  return tempPath;
};

const buildProject = async (projectPath) => {
  await spawnPromiseWrapper('npm', ['install'], {
    cwd: projectPath,
  });

  await spawnPromiseWrapper('gulp', ['build'], {
    cwd: projectPath,
  });
};

const createTar = async (bundleDirectory, bundleName) => {
  const tarball = new TarGz({}, {
    // Do not inlcude the top level in the tar.gz
    fromBase: true,
  });
  const tarPath = path.join(bundleDirectory, '..', `${bundleName}.tar.gz`);
  await tarball.compress(bundleDirectory, tarPath);
  return tarPath;
};

const createZip = (bundleDirectory, bundleName) => {
  const zipPath = path.join(bundleDirectory, '..', `${bundleName}.zip`);

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(zipPath);
    writeStream.on('close', () => resolve(zipPath));

    const archive = archiver('zip');
    archive.on('error', (err) => {
      reject(err);
    });
    archive.pipe(writeStream);
    // Adds the directory contents to the zip.
    archive.directory(bundleDirectory, false);
    archive.finalize();
  });
};

/**
 * This function will create a directory with the same name at the
 * .tar.gz file it generates. This way when the file is extracted
 * the folder structure will have the sam
 */
const bundleProject = async (projectPath, tagName) => {
  const pattern = path.posix.join(projectPath, 'packages', '**',
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME,
    '*.{js,map}');

  const filesToIncludeInBundle = glob.sync(pattern);
  const bundleDirectory = path.join(projectPath, '..', 'github-bundle');

  filesToIncludeInBundle.forEach((fileToInclude) => {
    fs.copySync(
      fileToInclude,
      path.join(bundleDirectory, path.basename(fileToInclude))
    );
  });

  const bundleName = `workbox-${tagName}`;
  const tarPath = await createTar(bundleDirectory, bundleName);
  const zipPath = await createZip(bundleDirectory, bundleName);

  return {
    bundleDirectory,
    tarPath,
    zipPath,
  };
};

const handleGithubAndCDNRelease = async (tagName, gitBranch, release) => {
  let releaseCreation = Promise.resolve();
  if (!release) {
    releaseCreation = github.repos.createRelease({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      tag_name: tagName,
      draft: true,
      name: tagName,
    })
    .then((response) => {
      release = response.data;
    });
  }

  await releaseCreation;

  const tagDownloadPath = await downloadGitCommit(gitBranch);

  await buildProject(tagDownloadPath);

  const bundleDetails = await bundleProject(tagDownloadPath, tagName);

  await github.repos.uploadAsset({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    id: release.id,
    filePath: bundleDetails.tarPath,
    name: path.basename(bundleDetails.tarPath),
    label: path.basename(bundleDetails.tarPath),
  });

  await github.repos.uploadAsset({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    id: release.id,
    filePath: bundleDetails.zipPath,
    name: path.basename(bundleDetails.zipPath),
    label: path.basename(bundleDetails.zipPath),
  });

  await uploadBundleToCDN(tagName, bundleDetails.bundleDirectory);
};

const findReleasesForTags = async (tagNames) => {
  const releasesData = await github.repos.getReleases({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  });

  const allReleases = releasesData.data;
  return tagNames.map((tagData) => {
    let matchingRelease = null;

    allReleases.forEach((release) => {
      if (release.tag_name === tagData.name) {
        matchingRelease = release;
      }
    });

    return {
      tagData: tagData,
      release: matchingRelease,
    };
  });
};

const filterTagsWithBundles = (tagsAndReleases) => {
  return tagsAndReleases.filter((tagAndRelease) => {
    const release = tagAndRelease.release;
    if (release && release.assets.length > 0) {
      // If a tag has a release and there is an asset let's assume the
      // the release is fine. Note: Github's source doesn't count as an
      // asset
      return false;
    }

    return true;
  });
};

const findTagsWithoutBundles = async () => {
  // Get all of the tags in the repo.
  const tagsResponse = await github.repos.getTags({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  });

  // We only want tags that are v3.0.0 or above.
  const tagsData = tagsResponse.data;
  let tagsAndReleaseData = tagsData.filter((tagData) => {
    return semver.gte(tagData.name, constants.MIN_RELEASE_TAG_TO_PUBLISH);
  });

  tagsAndReleaseData = await findReleasesForTags(tagsAndReleaseData);
  tagsAndReleaseData = filterTagsWithBundles(tagsAndReleaseData);

  return tagsAndReleaseData;
};

const publishTagAndReleaseBundles = async (tagsAndReleaseData) => {
  for (let tagAndRelease of tagsAndReleaseData) {
    const tag = tagAndRelease.tagData;
    const release = tagAndRelease.release;
    await handleGithubAndCDNRelease(tag.name, tag.name, release);
  }
};

gulp.task('publish-bundle:generate-from-tags', async () => {
  const tagsAndReleaseData = await findTagsWithoutBundles();
  await publishTagAndReleaseBundles(tagsAndReleaseData);
});

gulp.task('publish-bundle:clean', () => {
  return fs.remove(BUILD_PATH);
});

// TODO: Delete this task when v3 is about to launch.
gulp.task('publish-bundle:temp-v3-branch-build', async () => {
  const tagName = 'v3.0.0-alpha';
  const gitBranch = 'v3';

  let tagsAndReleaseData = await findReleasesForTags([{name: tagName}]);
  tagsAndReleaseData = filterTagsWithBundles(tagsAndReleaseData);
  for (let tagAndRelease of tagsAndReleaseData) {
    const tag = tagAndRelease.tagData;
    const release = tagAndRelease.release;
    // Override the git branch here since we aren't actually
    // using a tagged release.
    await handleGithubAndCDNRelease(tag.name, gitBranch, release);
  }
});

gulp.task('publish-bundle', gulp.series(
  'publish-bundle:clean',
  'publish-bundle:generate-from-tags',
  'publish-bundle:temp-v3-branch-build',
));

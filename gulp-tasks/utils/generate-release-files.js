const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const archiver = require('archiver');

const logHelper = require('./log-helper');
const spawnPromiseWrapper = require('./spawn-promise-wrapper');
const constants = require('./constants');

const BUILD_PATH = path.join(__dirname, '..', '..',
  constants.GENERATED_RELEASE_FILES_DIRNAME);
const GITHUB_OWNER = 'GoogleChrome';
const GITHUB_REPO = 'workbox';

const downloadGitCommit = async (gitBranch, sourceCodePath) => {
  try {
    const stats = await fs.stat(sourceCodePath);
    if (stats) {
      logHelper.log(`Git repo for branch '${gitBranch}' is cloned already.`);
      return;
    }
  } catch (err) {
    // NOOP
  }

  logHelper.log(`Clone Git repo for branch: '${gitBranch}'.`);
  const params = [
    'clone',
    '--branch', gitBranch,
    '--depth', '1',
    `http://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git`,
    sourceCodePath,
  ];

  await spawnPromiseWrapper('git', params);
};

const buildProject = async (sourceCodePath) => {
  await spawnPromiseWrapper('npm', ['install'], {
    cwd: sourceCodePath,
  });

  await spawnPromiseWrapper('gulp', ['build'], {
    cwd: sourceCodePath,
  });
};

const createArchive = (bundleDirectory, outputFilePath, format, options) => {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputFilePath);
    writeStream.on('close', () => resolve(outputFilePath));

    const archive = archiver(format, options);
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
const groupBuildFiles = async (tagName, sourceCodePath, outputDir) => {
  const pattern = path.posix.join(sourceCodePath, 'packages', '**',
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME,
    '*.{js,map}');

  // Copy files in parallel.
  const filesToIncludeInBundle = glob.sync(pattern);
  await Promise.all(
    filesToIncludeInBundle.map(
      (fileToInclude) => fs.copy(
        fileToInclude,
        path.join(outputDir, path.basename(fileToInclude)),
      )
    )
  );
};

module.exports = async (tagName, gitBranch) => {
  const rootOfTag = path.join(BUILD_PATH, tagName);
  const sourceCodePath = path.join(rootOfTag, 'source-code');
  const buildFilesPath = path.join(rootOfTag, 'build-files');
  const archiveFilesPath = path.join(rootOfTag, 'archives');

  await downloadGitCommit(gitBranch, sourceCodePath);
  await buildProject(sourceCodePath);
  await groupBuildFiles(tagName, sourceCodePath, buildFilesPath);

  fs.ensureDirSync(archiveFilesPath);

  const archiveFilename = `workbox-${tagName}`;
  const tarPath = await createArchive(buildFilesPath,
    path.join(archiveFilesPath, `${archiveFilename}.tar.gz`), 'tar', {
      gzip: true,
    });
  const zipPath = await createArchive(buildFilesPath,
    path.join(archiveFilesPath, `${archiveFilename}.zip`), 'zip', {
      zlib: {level: 9},
    });

  return {
    buildFilesPath,
    tarPath,
    zipPath,
  };
};

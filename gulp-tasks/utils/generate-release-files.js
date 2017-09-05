const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const archiver = require('archiver');

const logHelper = require('./log-helper');
const spawnPromiseWrapper = require('./spawn-promise-wrapper');
const constants = require('./constants');

const doesDirectoryExist = async (directoryPath) => {
  let stats = null;
  try {
    stats = await fs.stat(directoryPath);
  } catch (err) {
    // NOOP
  }
  return stats !== null;
};

const downloadGitCommit = async (gitBranch, sourceCodePath) => {
  const dirExists = await doesDirectoryExist(sourceCodePath);
  if (dirExists) {
    logHelper.log(`Git repo for branch '${gitBranch}' is cloned already.`);
    return;
  }

  logHelper.log(`Clone Git repo for branch: '${gitBranch}'.`);

  await spawnPromiseWrapper('git', [
    'clone',
    '--branch', gitBranch,
    '--depth', '1',
    `http://github.com/${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}.git`,
    sourceCodePath,
  ]);
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

/*
 * This function will create a directory with the same name at the
 * .tar.gz file it generates. This way when the file is extracted
 * the folder structure will have the sam
 */
const groupBuildFiles = async (tagName, sourceCodePath, outputDir) => {
  const pattern = path.posix.join(
    sourceCodePath, 'packages', '**',
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME,
    '*.{js,map}');

  // Copy files in parallel.
  const filesToIncludeInBundle = glob.sync(pattern);
  await Promise.all(
    filesToIncludeInBundle.map(
      // Copy code from build files into a temporary bundle directory.
      (fileToInclude) => fs.copy(
        fileToInclude,
        path.join(outputDir, path.basename(fileToInclude)),
      )
    )
  );
};

module.exports = async (tagName, gitBranch) => {
  const tempReleasePath = path.join(
    __dirname, '..', '..', constants.GENERATED_RELEASE_FILES_DIRNAME);
  const tagBuildPath = path.join(tempReleasePath, tagName);
  const sourceCodePath = path.join(tagBuildPath, 'source-code');
  const buildFilesPath = path.join(tagBuildPath, 'build-files');
  const archiveFilesPath = path.join(tagBuildPath, 'archives');

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

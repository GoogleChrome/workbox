const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const archiver = require('archiver');
const oneLine = require('common-tags').oneLine;

const spawnPromiseWrapper = require('./spawn-promise-wrapper');
const constants = require('./constants');
const logHelper = require('../../infra/utils/log-helper');

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
  for (let fileToInclude of filesToIncludeInBundle) {
    await fs.copy(
      fileToInclude,
      path.join(outputDir, path.basename(fileToInclude)),
    );
  }
};

/**
 * This method is used by both publish-github and publish-cdn tasks.
 */
module.exports = async (tagName, gitBranch) => {
  const tempReleasePath = path.join(
    __dirname, '..', '..', constants.GENERATED_RELEASE_FILES_DIRNAME);
  const tagBuildPath = path.join(tempReleasePath, tagName);
  const sourceCodePath = path.join(tagBuildPath, 'source-code');
  const buildFilesPath = path.join(tagBuildPath, 'build-files');
  const archiveFilesPath = path.join(tagBuildPath, 'archives');

  logHelper.log(oneLine`
    Download the git source code for ${logHelper.highlight(gitBranch)} to
    ${logHelper.highlight(path.relative(process.cwd(), sourceCodePath))}
  `);
  await downloadGitCommit(gitBranch, sourceCodePath);

  logHelper.log(oneLine`
    Building the project....
  `);
  await buildProject(sourceCodePath);

  logHelper.log(oneLine`
    Grouping build files into
    ${logHelper.highlight(path.relative(process.cwd(), buildFilesPath))}
  `);
  await groupBuildFiles(tagName, sourceCodePath, buildFilesPath);

  fs.ensureDirSync(archiveFilesPath);

  const archiveFilename = `workbox-${tagName}`;
  const tarPath = path.join(archiveFilesPath, `${archiveFilename}.tar.gz`);
  const zipPath = path.join(archiveFilesPath, `${archiveFilename}.zip`);

  logHelper.log(oneLine`
    Creating .tar.gz file to
    ${logHelper.highlight(path.relative(process.cwd(), tarPath))}
  `);
  await createArchive(buildFilesPath, tarPath, 'tar', {gzip: true});

  logHelper.log(oneLine`
    Creating .zip file to
    ${logHelper.highlight(path.relative(process.cwd(), zipPath))}
  `);
  await createArchive(buildFilesPath, zipPath, 'zip', {zlib: {level: 9}});

  return {
    buildFilesPath,
    tarPath,
    zipPath,
  };
};

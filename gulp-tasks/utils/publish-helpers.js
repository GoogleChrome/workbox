const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const archiver = require('archiver');
const oneLine = require('common-tags').oneLine;

const spawn = require('./spawn-promise-wrapper');
const constants = require('./constants');
const logHelper = require('../../infra/utils/log-helper');

const SOURCE_CODE_DIR = 'source-code';
const GROUPED_BUILD_FILES = 'grouped-build-files';

const doesDirectoryExist = async (directoryPath) => {
  let stats = null;
  try {
    stats = await fs.stat(directoryPath);
  } catch (err) {
    return false;
  }
  return stats.isDirectory();
};

const getBuildPath = (tagName) => {
  const tempReleasePath = path.join(
    __dirname, '..', '..', constants.GENERATED_RELEASE_FILES_DIRNAME);
  return path.join(tempReleasePath, tagName);
};

const downloadGitCommit = async (tagName, gitBranch) => {
  if (!tagName) {
    throw new Error(`You must provide a tagName to 'downloadGitCommit()`);
  }

  if (!gitBranch) {
    throw new Error(`You must provide a gitBranch to 'downloadGitCommit()`);
  }

  const sourceCodePath = path.join(getBuildPath(tagName), SOURCE_CODE_DIR);

  logHelper.log(oneLine`
    Download Git Commit ${logHelper.highlight(gitBranch)}.
  `);

  const dirExists = await doesDirectoryExist(sourceCodePath);
  if (!dirExists) {
    logHelper.log(`    Clone Git repo for branch: '${gitBranch}'.`);

    await spawn('git', [
      'clone',
      '--branch', gitBranch,
      '--depth', '1',
      `http://github.com/${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}.git`,
      sourceCodePath,
    ]);
  } else {
    logHelper.log(`   Git repo for branch '${gitBranch}' is cloned already.`);
  }

  return sourceCodePath;
};

const buildGitCommit = async (tagName) => {
  const sourceCodePath = path.join(getBuildPath(tagName), SOURCE_CODE_DIR);

  logHelper.log(oneLine`
    Building Commit
    ${logHelper.highlight(path.relative(process.cwd(), sourceCodePath))}.
  `);

  await spawn('npm', ['install'], {
    cwd: sourceCodePath,
  });

  await spawn('gulp', ['build'], {
    cwd: sourceCodePath,
  });
};

/*
 * This function will create a directory with the same name as the
 * .tar.gz file it generates. This way when the file is extracted
 * the folder structure will be the same.
 */
const groupBuildFiles = async (tagName, gitBranch) => {
  const groupedBuildFiles =
    path.join(getBuildPath(tagName), GROUPED_BUILD_FILES);
  const dirExists = await doesDirectoryExist(groupedBuildFiles);

  if (!dirExists) {
    await downloadGitCommit(tagName, gitBranch);
    await buildGitCommit(tagName);

    const sourceCodePath = path.join(getBuildPath(tagName), SOURCE_CODE_DIR);

    const pattern = path.posix.join(
      sourceCodePath, 'packages', '**',
      constants.PACKAGE_BUILD_DIRNAME, '*.{js,map}');


    logHelper.log(oneLine`
      Grouping Build Files into
      ${logHelper.highlight(path.relative(process.cwd(), groupedBuildFiles))}.
    `);

    // Copy files from the source code and move into the grouped build
    // directory. In others, have a flat file structure of just the built files.
    const filesToIncludeInBundle = glob.sync(pattern);
    for (const fileToInclude of filesToIncludeInBundle) {
      await fs.copy(
        fileToInclude,
        path.join(groupedBuildFiles, path.basename(fileToInclude)),
      );
    }
  } else {
    logHelper.log(`   Builds files already grouped.`);
  }

  return groupedBuildFiles;
};

const createArchive = async (tagName, fileExtension, format, options) => {
  const archiveFilesPath = path.join(getBuildPath(tagName), 'archives');
  const archiveFilename = `workbox-${tagName}.${fileExtension}`;
  const outputFilePath = path.join(archiveFilesPath, archiveFilename);

  logHelper.log(oneLine`
    Creating ${format} and saving to
    ${logHelper.highlight(path.relative(process.cwd(), outputFilePath))}.
  `);

  fs.ensureDirSync(path.dirname(outputFilePath));

  const groupedBuildFiles =
    path.join(getBuildPath(tagName), GROUPED_BUILD_FILES);

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputFilePath);
    writeStream.on('close', () => resolve(outputFilePath));

    const archive = archiver(format, options);
    archive.on('error', reject);
    archive.pipe(writeStream);
    // Adds the directory contents to the zip.
    archive.directory(groupedBuildFiles, false);
    archive.finalize();
  });

  return outputFilePath;
};

const createTarGz = (tagName) => {
  return createArchive(tagName, 'tar.gz', 'tar', {
    gzip: true,
  });
};

const createZip = (tagName) => {
  return createArchive(tagName, 'zip', 'zip', {
    zlib: {level: 9},
  });
};

const createBundles = async (tagName, gitBranch) => {
  await groupBuildFiles(tagName, gitBranch);

  const tarPath = await createTarGz(tagName);
  const zipPath = await createZip(tagName);
  return {
    tarPath,
    zipPath,
  };
};

module.exports = {
  groupBuildFiles,
  createBundles,
};

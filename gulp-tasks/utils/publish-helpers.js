/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const execa = require('execa');
const fse = require('fs-extra');
const glob = require('glob');
const ol = require('common-tags').oneLine;
const upath = require('upath');

const {outputFilenameToPkgMap} = require('./output-filename-to-package-map');
const constants = require('./constants');
const logHelper = require('../../infra/utils/log-helper');

const SOURCE_CODE_DIR = 'source-code';
const GROUPED_BUILD_FILES = 'grouped-build-files';

const doesDirectoryExist = async (directoryPath) => {
  let stats = null;
  try {
    stats = await fse.stat(directoryPath);
  } catch (err) {
    return false;
  }
  return stats.isDirectory();
};

const getBuildPath = (tagName) => {
  const tempReleasePath = upath.join(
    __dirname,
    '..',
    '..',
    constants.GENERATED_RELEASE_FILES_DIRNAME,
  );
  return upath.join(tempReleasePath, tagName);
};

const downloadGitCommit = async (tagName, gitBranch) => {
  if (!tagName) {
    throw new Error(`You must provide a tagName to 'downloadGitCommit()`);
  }

  if (!gitBranch) {
    throw new Error(`You must provide a gitBranch to 'downloadGitCommit()`);
  }

  const sourceCodePath = upath.join(getBuildPath(tagName), SOURCE_CODE_DIR);

  logHelper.log(`Download Git Commit ${logHelper.highlight(gitBranch)}.`);

  const dirExists = await doesDirectoryExist(sourceCodePath);
  if (!dirExists) {
    logHelper.log(`    Clone Git repo for branch: '${gitBranch}'.`);

    await execa('git', [
      'clone',
      '--branch',
      gitBranch,
      '--depth',
      '1',
      `http://github.com/${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}.git`,
      sourceCodePath,
    ]);
  } else {
    logHelper.log(`   Git repo for branch '${gitBranch}' is cloned already.`);
  }

  return sourceCodePath;
};

const buildGitCommit = async (tagName) => {
  const sourceCodePath = upath.join(getBuildPath(tagName), SOURCE_CODE_DIR);

  logHelper.log(ol`
    Building Commit
    ${logHelper.highlight(upath.relative(process.cwd(), sourceCodePath))}.
  `);

  await execa('npm', ['install'], {cwd: sourceCodePath});

  await execa('gulp', ['build'], {cwd: sourceCodePath});

  // This is to try and fix GitHub and CDN steps from having file read / close
  // issues by removing any risk of spawn tasks being out of sync
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

/*
 * This function will create a directory with the same name as the
 * .tar.gz file it generates. This way when the file is extracted
 * the folder structure will be the same.
 */
const groupBuildFiles = async (tagName, gitBranch) => {
  const groupedBuildFiles = upath.join(
    getBuildPath(tagName),
    GROUPED_BUILD_FILES,
  );
  const dirExists = await doesDirectoryExist(groupedBuildFiles);

  if (!dirExists) {
    await downloadGitCommit(tagName, gitBranch);
    await buildGitCommit(tagName);

    const sourceCodePath = upath.join(getBuildPath(tagName), SOURCE_CODE_DIR);

    const browserPackages = Object.values(outputFilenameToPkgMap).map(
      (item) => item.name,
    );

    const pattern = upath.join(
      sourceCodePath,
      'packages',
      `{${browserPackages.join(',')}}`,
      constants.PACKAGE_BUILD_DIRNAME,
      '*.{js,mjs,map}',
    );

    logHelper.log(ol`
      Grouping Build Files into
      ${logHelper.highlight(upath.relative(process.cwd(), groupedBuildFiles))}.
    `);

    // Copy files from the source code and move into the grouped build
    // directory. In others, have a flat file structure of just the built files.
    const filesToInclude = glob.sync(pattern);
    for (const fileToInclude of filesToInclude) {
      await fse.copy(
        fileToInclude,
        upath.join(groupedBuildFiles, upath.basename(fileToInclude)),
      );
    }
  } else {
    logHelper.log(`   Build files already grouped.`);
  }

  return groupedBuildFiles;
};

module.exports = {
  groupBuildFiles,
};

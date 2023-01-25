/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {series, watch} = require('gulp');
const execa = require('execa');
const fse = require('fs-extra');
const upath = require('upath');

const logHelper = require('../infra/utils/log-helper');

const DOCS_DIRECTORY = upath.join(__dirname, '..', 'docs');

async function docs_build() {
  await fse.remove(DOCS_DIRECTORY);

  const queryString = [
    `projectRoot=/`,
    `basepath=/`,
    `productName=Workbox`,
  ].join('&');

  const params = [
    '-c',
    upath.join(__dirname, '..', 'jsdoc.conf'),
    '-d',
    DOCS_DIRECTORY,
  ];

  if (!(global.cliOptions && global.cliOptions.pretty)) {
    logHelper.warn(`

These docs will look ugly, but they will more accurately match what
is shown on developers.google.com.

You can view a friendlier UI by running

'gulp docs --pretty'
`);
    params.push(
      '--template',
      upath.join(
        __dirname,
        '..',
        'infra',
        'templates',
        'reference-docs',
        'jsdoc',
      ),
      '--query',
      queryString,
    );
  }

  if (global.cliOptions && global.cliOptions.debugDocs) {
    params.push('--debug');
  }

  await execa('jsdoc', params, {preferLocal: true});
}

function docs_watch() {
  const watcher = watch('packages/**/*', docs_build);
  watcher.on('error', (err) => logHelper.error(`Docs failed to build: `, err));
}

module.exports = {
  docs_build,
  docs: series(docs_build, docs_watch),
};

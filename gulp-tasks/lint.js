/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {parallel} = require('gulp');
const execa = require('execa');
const upath = require('upath');

async function lint_js() {
  await execa('eslint', [
    '**/*.{js,mjs}',
    '--config', 'javascript.eslintrc.js',
    '--ignore-path', '.gitignore',
  ], {
    cwd: upath.join(__dirname, '..'),
    preferLocal: true,
  });
}

async function lint_ts() {
  await execa('eslint', [
    '**/*.ts',
    '--config', 'typescript.eslintrc.js',
    '--ignore-path', '.gitignore',
  ], {
    cwd: upath.join(__dirname, '..'),
    preferLocal: true,
  });
}

module.exports = {
  lint_js,
  lint_ts,
  lint: parallel(lint_js, lint_ts),
};

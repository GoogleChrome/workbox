/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {parallel} = require('gulp');
const execa = require('execa');

async function lint_js() {
  await execa(
    'eslint',
    [
      '**/*.{js,mjs}',
      '--config',
      'javascript.eslintrc.js',
      '--ignore-path',
      '.gitignore',
    ],
    {preferLocal: true},
  );
}

async function lint_ts() {
  await execa(
    'eslint',
    [
      '**/*.ts',
      '--config',
      'typescript.eslintrc.js',
      '--ignore-path',
      '.gitignore',
    ],
    {preferLocal: true},
  );
}

module.exports = {
  lint_js,
  lint_ts,
  // Temporarily disable lint_ts until we upgrade our ESLint dependencies.
  lint: parallel(lint_js, lint_ts),
};

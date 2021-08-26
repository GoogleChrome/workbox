/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const execa = require('execa');
const ol = require('common-tags').oneLine;

const logHelper = require('../infra/utils/log-helper');

async function publish_lerna() {
  // See https://github.com/GoogleChrome/workbox/issues/2904#issuecomment-894452253
  const options = ['publish', '--force-publish', '--exact'];

  // gulp publish --distTag=latest would be the most common.
  if (global.cliOptions.distTag) {
    logHelper.log(
      ol`Using ${logHelper.highlight(
        '--dist-tag=' + global.cliOptions.distTag,
      )}`,
    );
    options.push('--dist-tag', global.cliOptions.distTag);
  } else {
    throw new Error(ol`Please set the --distTag command line option, normally
        to 'latest' (for a stable release) or 'next' (for a pre-release).`);
  }

  await execa('lerna', options, {
    preferLocal: true,
    stdio: 'inherit',
  });
}

module.exports = {
  publish_lerna,
};

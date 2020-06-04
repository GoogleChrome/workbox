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
  const options = ['publish', '--force-publish'];

  // gulp publish_lerna --distTag=blah takes precedence.
  if (global.cliOptions.distTag) {
    logHelper.log(ol`Using ${logHelper.highlight(
        '--dist-tag=' + global.cliOptions.distTag)}`);
    options.push('--dist-tag', global.cliOptions.distTag);
  } else {
    // If we're not on master, publish to next on npm.
    const {stdout} = await execa('git', ['symbolic-ref', '--short', 'HEAD']);
    if (stdout !== 'master') {
      logHelper.log(ol`Using ${logHelper.highlight('--dist-tag=next')} as
          the current git branch is ${logHelper.highlight(stdout)}.`);
      options.push('--dist-tag', 'next');
    }
  }

  await execa('lerna', options, {
    preferLocal: true,
    stdio: 'inherit',
  });
}

module.exports = {
  publish_lerna,
};

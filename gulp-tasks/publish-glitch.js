/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const del = require('del');
const execa = require('execa');
const fse = require('fs-extra');
const globby = require('globby');
const ol = require('common-tags').oneLine;
const olt = require('common-tags').oneLineTrim;
const tempy = require('tempy');
const upath = require('upath');

const logHelper = require('../infra/utils/log-helper');

const DEMOS_DIR = 'demos/src';

async function publish_glitch() {
  const glitchProjects = await globby('*', {cwd: DEMOS_DIR, onlyFiles: false});

  if (!process.env.GLITCH_PERSONAL_TOKEN) {
    throw new Error(ol`You must set a GLITCH_TOKEN in your environment to
        publish to Glitch (you must have owner or editor access for the
        demo associated with the token).`);
  }

  if (!process.env.GLITCH_WORKBOX_SECRET) {
    throw new Error(ol`You must set the correct GLITCH_SECRET in your
        environment to publish to Workbox Demos on Glitch.`);
  }

  for (const project of glitchProjects) {
    const projectURL = olt`https://${process.env.GLITCH_PERSONAL_TOKEN}
        @api.glitch.com/git/${project}`;
    const projectPath = tempy.directory();

    try {
      await execa('git', ['clone', projectURL, projectPath]);
      await fse.copy(upath.join(DEMOS_DIR, project), projectPath, {
        overwrite: true,
      });
      await execa('git', ['checkout', '-b', 'glitch'], {cwd: projectPath});
      await execa('git', ['add', '-A'], {cwd: projectPath});
      await execa('git', ['commit', `-m'Autocommit on ${new Date()}'`], {
        cwd: projectPath,
      });
      await execa(
        'git',
        ['push', 'origin', 'glitch', '-f', '--set-upstream', '--no-verify'],
        {cwd: projectPath},
      );

      const deployURL = new URL(`https://${project}.glitch.me/deploy`);
      deployURL.searchParams.set('secret', process.env.GLITCH_WORKBOX_SECRET);
      deployURL.searchParams.set(
        'repo',
        `https://api.glitch.com/git/${project}`,
      );
      await execa('curl', ['-X', 'POST', deployURL.href]);
    } catch (error) {
      logHelper.error(`'${error}' occurred while processing ${project}.`);
    }

    await del(projectPath, {force: true});
  }
}

module.exports = {
  publish_glitch,
};

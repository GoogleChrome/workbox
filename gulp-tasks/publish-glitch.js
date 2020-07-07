/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');
const childProcess = require('child_process');
const fse = require('fs-extra');
const tempy = require('tempy');
const util = require('util');
const del = require('del');

const exec = util.promisify(childProcess.exec);

const glitchProjects = [
  'workbox-core',
  'workbox-sw',
  'workbox-precaching',
  'workbox-strategies',
  'workbox-background-sync-demo',
  'workbox-routing',
  'workbox-expiration',
  'workbox-cacheable-response',
  'workbox-google-analytics',
  'workbox-streams',
  'workbox-range-requests',
  'workbox-broadcast-update-demo',
  'workbox-window',
  'workbox-navigation-preload',
];


gulp.task('publish-glitch', async () => {
  if (!process.env.GLITCH_PERSONAL_TOKEN) {
    throw new Error('You must set a GLITCH_TOKEN in your environment to ' +
      'publish to Glitch (you must have owner or editor access for the ' +
      'demo associated w/ the token).');
  }

  if (!process.env.GLITCH_WORKBOX_SECRET) {
    throw new Error('You must set the correct GLITCH_SECRET in your ' +
      'environment to publish to Workbox Demos on Glitch.');
  }

  for (const project of glitchProjects) {
    // repo URLs can be associated w/ the demo folder through a predefined object OR th
    // for each repo...
    const projectURL = 'https://' + process.env.GLITCH_PERSONAL_TOKEN + '@api.glitch.com/git/' + project;
    const projectPath = tempy.directory();
    const date = new Date();

    try {
      await exec(`git clone ${projectURL} ${projectPath}`);
      await fse.copy('demos/src/' + project + '/', projectPath,
          {overwrite: true});
      await exec(`git checkout -b glitch`, {cwd: projectPath});
      await exec(`git add -A`, {cwd: projectPath});
      await exec(`git commit -m'Commiting from gulp on ${date.toString()}'`,
          {cwd: projectPath});
      await exec(`git push origin glitch -f --set-upstream --no-verify`,
          {cwd: projectPath});
      await exec(`curl -X POST "${'https://' + project + '.glitch.me/deploy?secret=' + process.env.GLITCH_WORKBOX_SECRET + '&repo=https://api.glitch.com/git/' + project}"`);
      await del(projectPath, {force: true});
      console.log('Push attempted to ' + project);
    } catch (e) {
      console.log(project);
      console.log(e.stdout);
    }
  }
});

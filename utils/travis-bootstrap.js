/*
 Copyright 2017 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

(async () => {
  const match = /\.(\d+)$/.exec(process.env.TRAVIS_JOB_NUMBER);
  // Bail early if we're not in the Travis environment.
  if (match === null) {
    console.log(`Can't detect Travis job number; exiting.`);
    return;
  }

  const COMPLETION_FILE = 'travis-bootstrapped';
  const promisify = require('promisify-node');

  if (match[1] === '1') {
    console.log(`This is the first job in the build; bootstrapping...`);
    // If this is the first build job, then install gulp and bootstrap lerna.
    const {processPromiseWrapper} = require('./build');
    await processPromiseWrapper('npm', ['install', '-g', 'gulp-cli']);
    await processPromiseWrapper('npm', ['run', 'lerna-bootstrap']);

    const fsExtraPromise = promisify('fs-extra');
    // Touch the COMPLETION_FILE to signify that we're done.
    await fsExtraPromise.ensureFile(COMPLETION_FILE);
    console.log(`..bootstrapping complete.`);
  } else {
    console.log(`This is not the first job; waiting on bootstrapping...`);
    // If we're not the first build job, then wait until the COMPLETION_FILE is
    // created, and then exit without installing anything.
    const waitOnPromise = promisify('wait-on');
    await waitOnPromise({resources: [COMPLETION_FILE]});
    console.log(`...bootstrapping was completed by another job.`);
  }
})();

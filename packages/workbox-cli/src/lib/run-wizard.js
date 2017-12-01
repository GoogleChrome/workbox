/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const fse = require('fs-extra');
const ol = require('common-tags').oneLine;

const askQuestions = require('./questions/ask-questions');
const logger = require('./logger');

module.exports = async () => {
  const {configLocation, config} = await askQuestions();

  const contents = `module.exports = ${JSON.stringify(config, null, 2)};`;
  await fse.writeFile(configLocation, contents);

  logger.log(`To build your service worker, run

  workbox generateSW ${configLocation}

as part of a build process. See https://goo.gl/fdTQBf for details.`);

  logger.log(ol`You can further customize your service worker by making changes
    to ${configLocation}. See https://goo.gl/YYPcyY for details.`);
};

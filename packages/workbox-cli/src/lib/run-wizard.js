/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const fse = require('fs-extra');
const ol = require('common-tags').oneLine;

const askQuestions = require('./questions/ask-questions');
const logger = require('./logger');

module.exports = async (options = {}) => {
  const {configLocation, config} = await askQuestions(options);

  const contents = `module.exports = ${JSON.stringify(config, null, 2)};`;
  await fse.writeFile(configLocation, contents);

  const command = options.injectManifest ? 'injectManifest' : 'generateSW';
  logger.log(`To build your service worker, run

  workbox ${command} ${configLocation}

as part of a build process. See https://goo.gl/fdTQBf for details.`);

  const configDocsUrl = options.injectManifest ?
    'https://goo.gl/8bs14N' :
    'https://goo.gl/gVo87N';

  logger.log(ol`You can further customize your service worker by making changes
    to ${configLocation}. See ${configDocsUrl} for details.`);
};

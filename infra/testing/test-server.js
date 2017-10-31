const express = require('express');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const serveIndex = require('serve-index');

const constants = require('../../gulp-tasks/utils/constants');
const logHelper = require('../utils/log-helper');

const app = express();

app.get(/\/__WORKBOX\/buildFile\/(workbox-[A-z]*)(\.(?:dev|prod)\.(.*))*/, (req, res) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  const moduleName = req.params[0];
  const fileExtension = req.params[2];

  const modulePath = path.posix.join(__dirname, '..', '..', 'packages', moduleName);
  const pkg = require(
    path.join(modulePath, 'package.json')
  );

  const browserFile = pkg.browser;
  const libraryPath = path.dirname(path.join(modulePath, browserFile));
  let libraryFileName = path.basename(browserFile);
  switch (process.env.NODE_ENV) {
    case constants.BUILD_TYPES.dev:
      libraryFileName = libraryFileName.replace('.prod.', '.dev.');
      break;
    case constants.BUILD_TYPES.prod:
      // NOOP.
      break;
    default:
      res.status(404).send(`Unknown process.env.NODE_ENV.`);
  }
  if (fileExtension === 'js.map') {
    libraryFileName += '.map';
  }
  res.sendFile(path.join(libraryPath, libraryFileName));
});

let server = null;
let requestCounts = {};
module.exports = {
  start: () => {
    return new Promise((resolve) => {
      const staticPath = path.join(__dirname, '..', '..');

      // This allows test to assess how many requests were made to the server.
      app.use((req, res, next) => {
        if (!requestCounts[req.url]) {
          requestCounts[req.url] = 0;
        }

        requestCounts[req.url] += 1;
        next();
      });

      app.use(
        express.static(staticPath),
        serveIndex(staticPath, {'icons': true})
      );

      server = app.listen(3004, () => {
        logHelper.log(oneLine`
          Test server running @ ${logHelper.highlight('http://localhost:3004')}
        `);
        resolve();
      });
    });
  },
  stop: () => {
    if (!server) {
      return;
    }

    server.close();
  },
  getAddress: () => {
    return 'http://localhost:3004';
  },
  reset: () => {
    requestCounts = {};
  },
  getRequests: () => {
    return Object.assign({}, requestCounts);
  },
};

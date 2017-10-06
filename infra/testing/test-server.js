const express = require('express');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const serveIndex = require('serve-index');

const logHelper = require('../utils/log-helper');

const app = express();

app.get('/__WORKBOX/buildFile/:moduleName', (req, res) => {
  const moduleName = req.params.moduleName;
  const modulePath = path.join(__dirname, '..', '..', 'packages', moduleName);
  const pkg = require(
    path.join(modulePath, 'package.json')
  );
  const libraryPath = path.dirname(path.join(modulePath, pkg.browser));
  let libraryFileName = path.basename(pkg.main);
  switch (process.env.NODE_ENV) {
    case 'dev':
      libraryFileName = libraryFileName.replace('.prod.', '.dev.');
      break;
    case 'production':
      // NOOP.
      break;
    default:
      res.status(404).send(`Unknown process.env.NODE_ENV.`);
  }
  res.sendFile(path.join(libraryPath, libraryFileName));
});

let server = null;

module.exports = {
  start: () => {
    return new Promise((resolve) => {
      const staticPath = path.join(__dirname, '..', '..');
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
};

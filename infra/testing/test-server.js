const express = require('express');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const serveIndex = require('serve-index');

const logHelper = require('../utils/log-helper');

const app = express();

app.get('/__WORKBOX/:moduleName', (req, res) => {
  res.send(`Hello ${req.params.moduleName}!`);
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

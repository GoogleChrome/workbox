const express = require('express');
const oneLine = require('common-tags').oneLine;

const logHelper = require('../utils/log-helper');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

let server = null;

module.exports = {
  start: () => {
    return new Promise((resolve) => {
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

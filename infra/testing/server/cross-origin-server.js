/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const express = require('express');

const PORT = 3010;

let app;
let server;

function initApp(staticDir) {
  app = express();
  app.use(express.static(staticDir));
}

function start(staticDir) {
  if (!app) {
    initApp(staticDir);
  }

  return new Promise((resolve, reject) => {
    server = app.listen(PORT, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(`http://localhost:${PORT}`);
      }
    });
  });
}

function stop() {
  if (server) {
    server.close();
  }
}

module.exports = {
  start,
  stop,
};

/*
 Copyright 2016 Google Inc. All Rights Reserved.
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

/**
 * README:
 * This test server is used in unit tests as well as
 * by the 'gulp serve' task, so please make sure
 * changes here work in all scenarios.
 */

const path = require('path');
const express = require('express');
const serveIndex = require('serve-index');
const serveStatic = require('serve-static');

const app = express();

// Test iframe is used by sw-testing-helpers to scope service workers
app.get('/test/iframe/:random', function(req, res) {
  res.sendFile(path.join(__dirname, 'test-iframe.html'));
});

app.get('/__echo/filename/:file', function(req, res) {
  res.setHeader('Cache-Control', 24 * 60 * 60 * 1000);
  res.send(req.params.file);
});

app.get('/__echo/date/:file', function(req, res) {
  res.setHeader('Cache-Control', 24 * 60 * 60 * 1000);
  res.send(`${req.params.file}-${Date.now()}`);
});

let server;
module.exports = {
  start: (rootDirectory, port) => {
    if (server) {
      return Promise.reject(new Error('Server already started.'));
    }

    app.use('/', express.static(rootDirectory, {
      setHeaders: (res) => {
        res.setHeader('Service-Worker-Allowed', '/');
      },
    }));

    app.use(serveStatic(rootDirectory));
    app.use(serveIndex(rootDirectory, {view: 'details'}));

    return new Promise((resolve, reject) => {
      server = app.listen(port, 'localhost', () => {
        resolve(server.address().port);
      });
    });
  },
  stop: () => {
    server.close();
    server = null;
  },
};

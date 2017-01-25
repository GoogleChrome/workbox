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

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const serveIndex = require('serve-index');
const serveStatic = require('serve-static');

class ServerInstance {
  constructor() {
    this._server = null;

    this._app = express();
    this._app.use(cookieParser());

    // Test iframe is used by sw-testing-helpers to scope service workers
    this._app.get('/test/iframe/:random', function(req, res) {
      res.sendFile(path.join(__dirname, 'test-iframe.html'));
    });

    this._app.get('/__echo/filename/:file', function(req, res) {
      res.setHeader('Cache-Control', 'max-age=' + (24 * 60 * 60));
      res.send(req.params.file);
    });

    this._app.get('/__echo/date/:file', function(req, res) {
      res.setHeader('Cache-Control', 'max-age=' + (24 * 60 * 60));
      res.send(`${req.params.file}-${Date.now()}`);
    });

    this._app.all('/__echo/date-with-cors/:file', function(req, res) {
      res.setHeader('Access-Control-Allow-Methods',
        'POST, GET, PUT, DELETE, OPTIONS');
      res.setHeader('Cache-Control', 'max-age=' + (24 * 60 * 60));
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(`${req.params.file}-${Date.now()}`);
    });

    this._app.get('/__test/404/', function(req, res) {
      res.status(404).send('404');
    });

    this._app.get('/__test/redirect/:statusCode/', function(req, res) {
      const statusCode = parseInt(req.params.statusCode, 10);
      res.redirect(
        statusCode,
        `/__echo/filename/${statusCode}`
      );
    });

    this._app.get('/__test/cookie/', function(req, res) {
      res.send(JSON.stringify(req.cookies));
    });
  }

  start(rootDirectory, port) {
    if (typeof port === 'undefined') {
      port = 0;
    }

    if (this._server) {
      return Promise.reject(new Error('Server already started.'));
    }

    this._app.use('/', express.static(rootDirectory, {
      setHeaders: (res) => {
        res.append('Set-Cookie', `swtesting=${Date.now()}; Path=/;`);
        res.setHeader('Service-Worker-Allowed', '/');
      },
    }));

    this._app.use(serveStatic(rootDirectory));
    this._app.use(serveIndex(rootDirectory, {view: 'details'}));

    return new Promise((resolve, reject) => {
      this._server = this._app.listen(port, 'localhost', () => {
        if (process.env.TRAVIS) {
          /* eslint-disable no-console */
          console.log(`[Debug Info] Test Server: ` +
            `http://localhost:${this._server.address().port}`);
          console.log('');
          /* eslint-enable no-console */
        }
        resolve(this._server.address().port);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      this._server.close(resolve);
      this._server = null;
    });
  }
}

module.exports = ServerInstance;

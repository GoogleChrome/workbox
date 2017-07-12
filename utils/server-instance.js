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

/* eslint-disable require-jsdoc, no-console */

const cookieParser = require('cookie-parser');
const express = require('express');
const fs = require('fs');
const glob = require('glob');
const handlebars = require('handlebars');
const path = require('path');
const serveIndex = require('serve-index');
const serveStatic = require('serve-static');

class ServerInstance {
  constructor() {
    this._server = null;
    this._sockets = [];

    this._app = express();
    this._app.use(cookieParser());

    this._counter = 1;

    // Test iframe is used by sw-testing-helpers to scope service workers
    this._app.get('/test/iframe/:random', function(req, res) {
      res.sendFile(path.join(__dirname, 'test-iframe.html'));
    });

    this._app.get('/__echo/filename/:file', function(req, res) {
      res.setHeader('Cache-Control', 'max-age=' + (24 * 60 * 60));
      res.send(req.params.file);
    });

    this._app.get('/__echo/counter', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.type('text').send(JSON.stringify(this._counter++));
    });

    this._app.get('/__echo/date/:file', function(req, res) {
      res.setHeader('Cache-Control', 'max-age=' + (24 * 60 * 60));
      res.send(`${req.params.file}-${Date.now()}`);
    });

    this._app.all('/__echo/cors-no-cache/:file', function(req, res) {
      res.setHeader('Access-Control-Allow-Methods',
        'POST, GET, PUT, DELETE, OPTIONS');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
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

    this._app.get('/__test/cookie/:id', function(req, res) {
      res.send(JSON.stringify(req.cookies));
    });

    function respondWithScriptMatchingPattern(pattern, res) {
      const repoRoot = path.join(__dirname, '..');
      const devScript = glob.sync(pattern, {
        cwd: repoRoot,
        root: repoRoot,
      });

      console.log(devScript);

      if (devScript.length === 0) {
        const errMsg = `No built module found for pattern '${pattern}'.`;
        console.log(errMsg);
        res.status(500).send(errMsg);
        return;
      }

      // We can't send a redirect here, as they're not allowed for resources
      // pulled in via importScripts().
      res.setHeader('Content-Type', 'application/javascript');
      res.send(fs.readFileSync(devScript[0]));
    }

    // Used to return the latest iife bundle for a given package, without
    // having to specify the version string.
    // This is used within unit tests.
    this._app.get('/__test/bundle/:pkg', function(req, res) {
      // By default, the prod bundles of our library code is used, with the
      // primary consumer being our test suite. This can be overridden by
      // setting a TEST_BUNDLE environment variable to 'dev' prior to
      // starting the test suite.
      const build = process.env.WB_TEST_BUNDLE || 'prod';
      const pkg = req.params.pkg;
      const pattern = `packages/${pkg}/build/importScripts/*${build}*.js`;
      respondWithScriptMatchingPattern(pattern, res);
    });

    // Harness to kick off all the in-browser tests for a given package.
    // It will pick up a list of all the top-level .js files and automatically
    // inject them into the HTML as <script> tags.
    this._app.get('/__test/mocha/browser/:pkg', function(req, res) {
      const pkg = req.params.pkg;

      let config = {};
      try {
        // Read JSON file to avoid the require cache
        config =
          JSON.parse(
            fs.readFileSync(
              path.join(__dirname, '..', 'packages', pkg, 'test', 'config.json')
            , 'utf-8')
          );
      } catch (err) {
        // NOOP
      }

      const source = fs.readFileSync(path.join(
        __dirname, '..', 'templates', 'test-browser.hbs'), 'utf-8');

      const template = handlebars.compile(source);
      const html = template({
        config,
        pkg,
      });

      res.send(html);
    });

    this._app.get('/__test/mocha/sw/:pkg', function(req, res) {
      const pkg = req.params.pkg;
      const source = fs.readFileSync(path.join(
        __dirname, '..', 'templates', 'test-sw.hbs'), 'utf-8');
      const template = handlebars.compile(source);
      const html = template({pkg});

      res.send(html);
    });

    this._app.get('/__test/mocha/sw-utils.js', function(req, res) {
      const source = fs.readFileSync(path.join(
        __dirname, 'sw-test-utils.js'), 'utf-8');

        res.send(source);
    });

    // Redirect /packages/:pkg/test/browser/ to the /__test/mocha/browser/:pkg
    // templated page, but only if there's no
    // /packages/:pkg/test/browser/index.html
    this._app.get('/packages/:pkg/test/browser/', function(req, res, next) {
      const index = path.join(__dirname, '..', 'packages', req.params.pkg,
        'test', 'browser', 'index.html');
      if (fs.existsSync(index)) {
        next();
      } else {
        res.redirect(301, `/__test/mocha/browser/${req.params.pkg}`);
      }
    });

    this._app.get('/packages/:pkg/test/sw/', function(req, res, next) {
      const index = path.join(__dirname, '..', 'packages', req.params.pkg,
        'test', 'browser', 'index.html');
      if (fs.existsSync(index)) {
        next();
      } else {
        res.redirect(301, `/__test/mocha/sw/${req.params.pkg}`);
      }
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
          console.log(`[Debug Info] Test Server: ` +
            `http://localhost:${this._server.address().port}`);
          console.log('');
        }
        resolve(this._server.address().port);
      });

      this._server.on('connection', (socket) => {
        this._sockets.push(socket);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      this._sockets.forEach((socket) => {
        socket.destroy();
      });

      this._server.close(resolve);
      this._server = null;
    });
  }
}

module.exports = ServerInstance;

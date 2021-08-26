/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const bodyParser = require('body-parser');
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const requireDir = require('require-dir');
const serveIndex = require('serve-index');

const logHelper = require('../../utils/log-helper');
const RequestCounter = require('./request-counter');

const PORT = 3004;

let app;
let requestCounters;
let server;

function initApp() {
  app = express();

  // Configure nunjucks to work with express routes.
  nunjucks.configure('./', {express: app, noCache: true});

  // Exposed the `.body` property on requests for application/json.
  app.use(bodyParser.json());

  requestCounters = new Set();
  app.use((req, res, next) => {
    for (const requestCounter of requestCounters) {
      requestCounter.count(req);
    }
    next();
  });

  const routes = Object.values(requireDir('./routes'));
  for (const {match, handler, method} of routes) {
    app[method || 'get'](match, handler);
  }

  const staticDir = path.resolve(__dirname, '..', '..', '..');
  app.use(express.static(staticDir), serveIndex(staticDir, {icons: true}));
}

function start() {
  if (!app) {
    initApp();
  }

  return new Promise((resolve, reject) => {
    server = app.listen(PORT, (error) => {
      if (error) {
        reject(error);
      } else {
        logHelper.log(`The test server is running at ${getAddress()}`);
        resolve();
      }
    });
  });
}

function stop() {
  if (server) {
    server.close();
  }
}

function getAddress() {
  return `http://localhost:${PORT}`;
}

function startCountingRequests(headerValue) {
  const requestCounter = new RequestCounter(headerValue);
  requestCounters.add(requestCounter);
  return requestCounter;
}

function stopCountingRequests(requestCounter) {
  requestCounters.delete(requestCounter);
}

module.exports = {
  getAddress,
  start,
  startCountingRequests,
  stop,
  stopCountingRequests,
};

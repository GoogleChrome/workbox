const express = require('express');
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
  requestCounters = new Set();

  app.use((req, res, next) => {
    for (const requestCounter of requestCounters) {
      requestCounter.count(req);
    }
    next();
  });

  const routes = Object.values(requireDir('./routes'));
  for (const {match, handler} of routes) {
    app.get(match, handler);
  }

  const staticDir = path.resolve(__dirname, '..', '..', '..');
  app.use(
      express.static(staticDir),
      serveIndex(staticDir, {'icons': true})
  );
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

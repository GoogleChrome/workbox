const Koa = require('koa');
const path = require('path');
const requireDir = require('require-dir');
const Router = require('koa-router');
const serveList = require('koa-serve-list');
const serveStatic = require('koa-static');

const logHelper = require('../../utils/log-helper');
const RequestCounter = require('./request-counter');

const PORT = 3004;

let app;
let requestCounters;
let server;

function initApp() {
  app = new Koa();
  requestCounters = new Set();

  // app.use((ctx, next) => {
  //   for (const requestCounter of requestCounters) {
  //     requestCounter.count(ctx);
  //   }
  //   next();
  // });

  const routes = Object.values(requireDir('./routes'));
  const router = new Router();
  for (const {match, handler} of routes) {
    router.get(match, handler);
  }
  app.use(router.routes());

  const staticDir = path.resolve(__dirname, '..', '..', '..');
  app.use(serveList(staticDir));
  app.use(serveStatic(staticDir));
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
  return `http://localhost:${PORT}/`;
}

function startCountingRequests(headerValue) {
  const requestCounter = new RequestCounter(headerValue);
  requestCounters.add(requestCounter);
  return requestCounter;
}

function stopCountingRequests(requestCounter) {
  requestCounters.delete(requestCounter);
}

start();

module.exports = {
  getAddress,
  start,
  startCountingRequests,
  stop,
  stopCountingRequests,
};

// module.exports = {
//   start: () => {
//     return new Promise((resolve) => {
//       const staticPath = path.join(__dirname, '..', '..');

//       app.use((req, res, next) => {
//         const headerValue = req.get('Service-Worker-Navigation-Preload');
//         if (headerValue) {
//           if (!navigationPreloadCounter[headerValue]) {
//             navigationPreloadCounter[headerValue] = 0;
//           }
//           navigationPreloadCounter[headerValue]++;
//         }
//         next();
//       });

//       // This allows test to assess how many requests were made to the server.
//       app.use((req, res, next) => {
//         if (!requestCounts[req.url]) {
//           requestCounts[req.url] = 0;
//         }

//         requestCounts[req.url] += 1;
//         next();
//       });

//       app.use(
//         express.static(staticPath),
//         serveIndex(staticPath, {'icons': true})
//       );

//       app.get('/*/integration.html', (req, res) => {
//         const integrationPath = path.join(__dirname, 'integration.html');
//         res.sendFile(integrationPath);
//       });

//       server = app.listen(3004, () => {
//         logHelper.log(oneLine`
//           Test server running @ ${logHelper.highlight('http://localhost:3004')}
//         `);
//         resolve();
//       });
//     });
//   },
//   stop: () => {
//     if (!server) {
//       return;
//     }

//     server.close();
//   },
//   getAddress: () => {
//     return 'http://localhost:3004';
//   },
//   reset: () => {
//     requestCounts = {};
//   },
//   getRequests: () => {
//     return Object.assign({}, requestCounts);
//   },
//   resetPreloadCounter: () => {
//     navigationPreloadCounter = {};
//   },
//   getPreloadCounter: () => {
//     return Object.assign({}, navigationPreloadCounter);
//   },
// };

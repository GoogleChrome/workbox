const functions = require('firebase-functions');
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs-extra');

const cdnDetails = require('./cdn-details.json');

const workboxModules = [
  'workbox-background-sync',
  'workbox-broadcast-update',
  'workbox-cacheable-response',
  'workbox-core',
  'workbox-expiration',
  'workbox-google-analytics',
  'workbox-precaching',
  'workbox-range-requests',
  'workbox-routing',
  'workbox-strategies',
  'workbox-streams',
  'workbox-sw',
];

const app = express();
app.engine('hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');

app.get('/', function(req, res) {
  let moduleData = workboxModules.map((moduleName) => {
    const docPath = path.join(
        __dirname, 'views', 'demo', `${moduleName}.hbs`
    );

    let exists = false;
    try {
      fs.accessSync(docPath);
      exists = true;
    } catch (err) {
      // NOOP
    }

    return {
      name: moduleName,
      hasDemo: exists,
    };
  });

  res.render('home', {
    title: 'Workbox V3',
    modules: moduleData,
  });
});

app.get('/api/is-response-cacheable',
    function(req, res) {
      if (req.headers['x-is-cacheable']) {
        const value = req.headers['x-is-cacheable'];
        res.set('X-Is-Cacheable', value);
        res.send(`This response has 'X-Is-Cacheable' header set to '${value}'`);
      } else {
        res.send(`This response has no 'X-Is-Cacheable' header`);
      }
    }
);

app.get('/demo/:moduleName', function(req, res) {
  res.render(`demo/${req.params.moduleName}`, {
    title: `${req.params.moduleName} Demo`,
  });
});

app.get('/api/date', function(req, res) {
  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'no-cache');
  res.send(`Received from the server at ${new Date().toLocaleString()}`);
});

app.get('/demo/:moduleName/:swfile', function(req, res, next) {
  const swTemplate = path.basename(
      req.params.swfile,
      path.extname(req.params.swfile)
  );

  let cdnUrl = cdnDetails.latestUrl;
  let extraConfig = '';
  if (process.env.WORKBOX_DEMO_ENV === 'local') {
    cdnUrl = `/local-builds`;
    extraConfig = `,
  modulePathPrefix: '${cdnUrl}'`;
  }

  const swImport = `importScripts('${cdnUrl}/workbox-sw.js');

workbox.setConfig({
  debug: true${extraConfig}
});
`;

  res.header('Content-Type', 'application/javascript');
  res.header('Cache-Control', 'no-cache');
  res.render(`demo/${req.params.moduleName}/${swTemplate}`, {
    title: `${req.params.moduleName} Demo`,
    CDN_URL: cdnUrl,
    WORKBOX_SW_IMPORT: swImport,
    layout: false,
  });
});

module.exports = {
  app: functions.https.onRequest(app),
};

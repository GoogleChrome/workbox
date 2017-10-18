const functions = require('firebase-functions');
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');

const CDN_URL = 'https://storage.googleapis.com/workbox-cdn/releases/3.0.0-alpha.17';

const workboxModules = require('./modules.json');

const app = express();
app.engine('hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');

app.get('/', function(req, res) {
  res.render('home', {
    title: 'Workbox V3',
    modules: workboxModules,
  });
});

app.get('/demo/:moduleName', function(req, res) {
  res.render(`demo/${req.params.moduleName}`, {
    title: `${req.params.moduleName} Demo`,
    modules: workboxModules,
  });
});

app.get('/demo/:moduleName/:swfile', function(req, res, next) {
  const swTemplate = path.basename(
    req.params.swfile,
    path.extname(req.params.swfile)
  );

  res.header('Content-Type', 'application/javascript');
  res.render(`demo/${req.params.moduleName}/${swTemplate}`, {
    title: `${req.params.moduleName} Demo`,
    modules: workboxModules,
    CDN_URL,
    layout: false,
  });
});

module.exports = {
  app: functions.https.onRequest(app),
};

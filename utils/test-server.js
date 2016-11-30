const swTestingHelpers = require('sw-testing-helpers');
const path = require('path');

const testServer = new swTestingHelpers.TestServer();
const app = testServer.getExpressApp();

app.get('/test/iframe/:random', function(req, res) {
  res.sendFile(path.join(__dirname, 'test-iframe.html'));
});

app.get('/__echo/filename/:file', function(req, res) {
  res.send(req.params.file);
});
app.get('/__echo/date/:file', function(req, res) {
  res.send(`${req.params.file}-${Date.now()}`);
});

module.exports = testServer;

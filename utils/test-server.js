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

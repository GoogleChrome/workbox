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

/* eslint-disable no-console, valid-jsdoc */

const gulp = require('gulp');
const createTestServer = require('../utils/create-test-server.js');

gulp.task('serve', (unusedCallback) => {
  return createTestServer().start('.', global.port)
  .then((port) => {
    console.log(`Primary Server               http://localhost:${port}/`);
    return createTestServer().start('.', global.port + 1);
  })
  .then((secondPort) => {
    console.log(`Third Party Server           http://localhost:${secondPort}/`);
  });
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {parallel} = require('gulp');

const {lint} = require('./lint');
// const {test_integration} = require('./test-integration');
const {test_node} = require('./test-node');

module.exports = {
  test: parallel(lint, test_node),
};

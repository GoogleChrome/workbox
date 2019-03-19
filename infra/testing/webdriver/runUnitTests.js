/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const waitUntil = require('../wait-until');


// Store local references of these globals.
const {webdriver, server} = global.__workbox;

const runUnitTests = async (testPath) => {
  await webdriver.get(server.getAddress() + testPath);

  // Wait until the mocha tests are finished.
  await waitUntil(async () => {
    return await webdriver.executeScript(() => self.mochaResults);
  }, 120, 500); // Retry for 60 seconds.

  const results = await webdriver.executeScript(() => self.mochaResults);

  if (results.failures > 0) {
    console.log(`\n${results.failures} test failure(s):`);

    for (const report of results.reports) {
      console.log('');
      console.log('Name     : ', report.name);
      console.log('Message  : ', report.message);
      console.log('Error    : ', report.stack);
    }
    console.log('');

    throw new Error('Unit tests failed, see logs above for details');
  }
};

module.exports = {runUnitTests};

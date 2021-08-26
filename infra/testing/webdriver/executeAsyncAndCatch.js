/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// Store local references of these globals.
const {webdriver} = global.__workbox;

/**
 * Executes the passed function (and args) async and logs any errors that
 * occur. Errors are assumed to be passed to the callback as an object
 * with the `error` property.
 *
 * @param {...*} args
 * @return {*}
 */
const executeAsyncAndCatch = async (...args) => {
  const result = await webdriver.executeAsyncScript(...args);

  if (result && result.error) {
    console.error(result.error);
    throw new Error('Error executing async script');
  }
  return result;
};

module.exports = {executeAsyncAndCatch};

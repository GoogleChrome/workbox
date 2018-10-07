/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = async (fn, retries = 20, intervalMillis = 50) => {
  for (let i = 0; i < retries; i++) {
    const result = await fn();
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMillis));
  }
  throw new Error(`${fn} didn't return true after ${retries} retries.`);
};

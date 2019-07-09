/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/


module.exports = (webpackError, stats) => {
  if (webpackError) {
    throw new Error(webpackError.message);
  }

  const statsJson = stats.toJson('verbose');

  if (statsJson.errors.length > 0) {
    throw new Error(statsJson.errors.join('\n'));
  }

  if (statsJson.warnings.length > 0) {
    throw new Error(statsJson.warnings.join('\n'));
  }
};

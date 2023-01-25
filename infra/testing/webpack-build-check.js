/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

function joinMessages(errorsOrWarnings) {
  if (errorsOrWarnings[0].message) {
    return errorsOrWarnings.map((item) => item.message).join('\n');
  } else {
    return errorsOrWarnings.join('\n');
  }
}

module.exports = (webpackError, stats) => {
  if (webpackError) {
    throw new Error(webpackError.message);
  }

  const statsJson = stats.toJson('verbose');

  if (statsJson.errors.length > 0) {
    throw new Error(joinMessages(statsJson.errors));
  }

  if (statsJson.warnings.length > 0) {
    throw new Error(joinMessages(statsJson.warnings));
  }
};

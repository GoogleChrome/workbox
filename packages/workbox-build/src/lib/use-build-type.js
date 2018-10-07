/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// This is the build type that is expected to be present "by default".
const DEFAULT_BUILD_TYPE = 'prod';

/**
 * Switches a string from using the "default" build type to an alternative
 * build type. In practice, this is used to swap out "prod" for "dev" in the
 * filename of a Workbox library.
 *
 * @param {string} source The path to a file, which will normally contain
 * DEFAULT_BUILD_TYPE somewhere in it.
 * @param {string} buildType The alternative build type value to swap in.
 * @return {string} source, with the last occurrence of DEFAULT_BUILD_TYPE
 * replaced with buildType.
 * @private
 */
module.exports = (source, buildType) => {
  // If we want the DEFAULT_BUILD_TYPE, then just return things as-is.
  if (buildType === DEFAULT_BUILD_TYPE) {
    return source;
  }
  // Otherwise, look for the last instance of DEFAULT_BUILD_TYPE, and replace it
  // with the new buildType. This is easier via split/join than RegExp.
  const parts = source.split(DEFAULT_BUILD_TYPE);
  // Join the last two split parts with the new buildType. (If parts only has
  // one item, this will be a no-op.)
  const replaced = parts.slice(parts.length - 2).join(buildType);
  // Take the remaining parts, if any exist, and join them with the replaced
  // part using the DEFAULT_BUILD_TYPE, to restore any other matches as-is.
  return [
    ...parts.slice(0, parts.length - 2),
    replaced,
  ].join(DEFAULT_BUILD_TYPE);
};

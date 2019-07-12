/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const stringify = require('json-stable-stringify');

module.exports = (manifestEntries, injectionPoint, prettyPrint) => {
  // json-stable-stringify ensures that we get a consistent output, with all
  // the properties of each object sorted.
  // There's a hash created of the serialized JSON data, and we want the hash to
  // be the same if the data is the same, without any sort-order variation.
  const entriesJson = stringify(
      manifestEntries,
      prettyPrint ? {space: 2} : {}
  );
  return `${injectionPoint} = ${entriesJson};`;
};

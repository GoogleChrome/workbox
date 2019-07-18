/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const errors = require('./errors');

module.exports = (additionalManifestEntries) => {
  return (manifest) => {
    const warnings = [];
    const stringEntries = new Set();

    for (const additionalEntry of additionalManifestEntries) {
      if (typeof additionalEntry === 'string') {
        stringEntries.add(additionalEntry);
      }

      manifest.push(additionalEntry);
    }

    if (stringEntries.size > 0) {
      let urls = '\n';
      for (const stringEntry of stringEntries) {
        urls += `  - ${stringEntry}\n`;
      }

      warnings.push(errors['string-entry-warning'] + urls);
    }

    return {
      manifest,
      warnings,
    };
  };
};

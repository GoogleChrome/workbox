'use strict';

const errors = require('../errors');

module.exports = (regexp) => {
  if (!(regexp instanceof RegExp)) {
    throw new Error(errors['invalid-dont-cache-bust']);
  }

  return (manifest) => manifest.map((entry) => {
    if (typeof entry.url !== 'string') {
      throw new Error(errors['manifest-entry-bad-url']);
    }

    if (entry.url.match(regexp)) {
      delete entry.revision;
    }
    return entry;
  });
};

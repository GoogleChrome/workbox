const path = require('path');

const errors = require('../errors');

module.exports = (fileExtentionsToCache) => {
  if (!fileExtentionsToCache || !(fileExtentionsToCache instanceof Array) ||
    fileExtentionsToCache.length === 0) {
      throw new Error(errors['no-file-extensions-to-cache']);
  }

  for (let i = 0; i < fileExtentionsToCache.length; i++) {
    const fileExtension = fileExtentionsToCache[i];
    if (!fileExtension || typeof fileExtension !== 'string' ||
      fileExtension.length === 0) {
        throw new Error(errors['no-file-extensions-to-cache']);
    }

    if (fileExtension.substring(0, 1) === '.') {
      throw new Error(errors['no-file-extensions-to-cache']);
    }
  }

  // Glob patterns only work with forward slash
  // https://github.com/isaacs/node-glob#windows
  const globPath = path.join('**', '*').replace(path.sep, '/');
  if (fileExtentionsToCache.length > 1) {
    // Return pattern '**/*.{txt,md}'
    return globPath + `.{${fileExtentionsToCache.join(',')}}`;
  } else {
    // Return pattern '**/*.txt'
    return globPath + `.${fileExtentionsToCache[0]}`;
  }
};

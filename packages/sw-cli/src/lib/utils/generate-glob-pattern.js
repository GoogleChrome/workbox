const path = require('path');

module.exports = (relativePath, fileExtentionsToCache) => {
  // Glob patterns only work with forward slash
  // https://github.com/isaacs/node-glob#windows
  const globPath = path.join(relativePath, '**', '*').replace(path.sep, '/');
  if (fileExtentionsToCache.length > 1) {
    // Return pattern '**/*.{txt,md}'
    return globPath + `.{${fileExtentionsToCache.join(',')}}`;
  } else {
    // Return pattern '**/*.txt'
    return globPath + `.${fileExtentionsToCache[0]}`;
  }
};

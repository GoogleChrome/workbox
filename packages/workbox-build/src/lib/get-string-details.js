const getStringHash = require('./get-string-hash');

module.exports = (url, string) => {
  return {
    file: url,
    hash: getStringHash(string),
    size: string.length,
  };
};

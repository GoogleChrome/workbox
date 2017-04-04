const errors = require('../errors');

module.exports = (urlString, modifyUrlPrefix) => {
  if (typeof urlString !== 'string') {
    throw new Error(errors['modify-url-prefix-bad-url']);
  }

  if (!modifyUrlPrefix || typeof modifyUrlPrefix !== 'object' ||
    Array.isArray(modifyUrlPrefix)) {
    throw new Error(errors['modify-url-prefix-bad-prefixes']);
  }

  Object.keys(modifyUrlPrefix).forEach((key) => {
    if (typeof modifyUrlPrefix[key] !== 'string') {
      throw new Error(errors['modify-url-prefix-bad-prefixes']);
    }
  });

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const modifyRegex = new RegExp('^(' +
    Object.keys(modifyUrlPrefix).map(escapeRegExp).join('|') +
    ')');

  return urlString.replace(modifyRegex, (match) => {
    return modifyUrlPrefix[match];
  });
};

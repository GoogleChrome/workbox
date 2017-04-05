const errors = require('../errors');

/**
 * Escaping user input to be treated as a literal string within a regular
 * expression can be accomplished by simple replacement.
 *
 * From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
 *
 * @param  {string} string The string to be used as part of a regular
 *                         expression
 * @return {string}        A string that is safe to use in a regular
 *                         expression.
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

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

  // Escape the user input so it's safe to use in a regex.
  const safeModifyUrlPrefixes = Object.keys(modifyUrlPrefix).map(escapeRegExp);
  // Join all the `modifyUrlPrefix` keys so a single regex can be used.
  const prefixMatchesStrings = safeModifyUrlPrefixes.join('|');
  // Add `^` to the front the prefix matches so it only matches the start of
  // a string.
  const modifyRegex = new RegExp(`^(${prefixMatchesStrings})`);

  return urlString.replace(modifyRegex, (match) => {
    return modifyUrlPrefix[match];
  });
};

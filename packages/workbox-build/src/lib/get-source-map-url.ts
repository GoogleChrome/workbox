/*
  Copyright 2022 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// Adapted from https://github.com/lydell/source-map-url/blob/master/source-map-url.js
// See https://github.com/GoogleChrome/workbox/issues/3019
const innerRegex = /[#@] sourceMappingURL=([^\s'"]*)/;
const regex = RegExp(
  '(?:' +
    '/\\*' +
    '(?:\\s*\r?\n(?://)?)?' +
    '(?:' +
    innerRegex.source +
    ')' +
    '\\s*' +
    '\\*/' +
    '|' +
    '//(?:' +
    innerRegex.source +
    ')' +
    ')' +
    '\\s*',
);

export function getSourceMapURL(srcContents: string): string | null {
  const match = srcContents.match(regex);
  return match ? match[1] || match[2] || '' : null;
}

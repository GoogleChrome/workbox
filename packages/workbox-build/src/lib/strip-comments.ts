/*
  Copyright 2026 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Comment, parse} from 'acorn';

// A method like `foo() {}` is only valid inside of an object literal, while the
// other kinds of function are valid inside of parentheses.
const WRAPPERS = [
  ['(', '\n)'],
  ['({', '\n})'],
];

/**
 * @param {string} source The result of calling toString() on a function.
 * @return {string} The source without comments, or unchanged if it can't be
 * parsed, like the source of a native function.
 *
 * @private
 */
export function stripComments(source: string): string {
  for (const [prefix, suffix] of WRAPPERS) {
    const comments: Array<Comment> = [];
    try {
      parse(`${prefix}${source}${suffix}`, {
        ecmaVersion: 'latest',
        onComment: comments,
      });
    } catch {
      continue;
    }

    let result = '';
    let position = 0;
    for (const {start, end, type, value} of comments) {
      result += source.slice(position, start - prefix.length);
      // A block comment separates tokens, as in return/* */1, and one that
      // spans multiple lines also acts as a line break.
      if (type === 'Block') {
        result += value.includes('\n') ? '\n' : ' ';
      }
      position = end - prefix.length;
    }
    return result + source.slice(position);
  }

  return source;
}

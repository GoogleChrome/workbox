/*
  Copyright 2026 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * Template tag that joins a multi-line template literal into a single line.
 *
 * @private
 */
export function oneLine(
  strings: TemplateStringsArray,
  ...values: Array<unknown>
): string {
  return strings
    .reduce((result, string, i) => `${result}${String(values[i - 1])}${string}`)
    .replace(/\n\s*/g, ' ')
    .trim();
}

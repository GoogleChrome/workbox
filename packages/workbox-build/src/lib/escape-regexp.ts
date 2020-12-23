/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
export default function(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

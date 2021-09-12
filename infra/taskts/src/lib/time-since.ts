/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

export function timeSince(start: number): string {
  return ((Date.now() - start) / 1000).toFixed(2);
}

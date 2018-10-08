/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxError} from 'workbox-core/_private/WorkboxError.mjs';
import {assert} from 'workbox-core/_private/assert.mjs';

import '../_version.mjs';

/**
 * @param {Blob} blob A source blob.
 * @param {number|null} start The offset to use as the start of the
 * slice.
 * @param {number|null} end The offset to use as the end of the slice.
 * @return {Object} An object with `start` and `end` properties, reflecting
 * the effective boundaries to use given the size of the blob.
 *
 * @private
 */
function calculateEffectiveBoundaries(blob, start, end) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isInstance(blob, Blob, {
      moduleName: 'workbox-range-requests',
      funcName: 'calculateEffectiveBoundaries',
      paramName: 'blob',
    });
  }

  const blobSize = blob.size;

  if (end > blobSize || start < 0) {
    throw new WorkboxError('range-not-satisfiable', {
      size: blobSize,
      end,
      start,
    });
  }

  let effectiveStart;
  let effectiveEnd;

  if (start === null) {
    effectiveStart = blobSize - end;
    effectiveEnd = blobSize;
  } else if (end === null) {
    effectiveStart = start;
    effectiveEnd = blobSize;
  } else {
    effectiveStart = start;
    // Range values are inclusive, so add 1 to the value.
    effectiveEnd = end + 1;
  }

  return {
    start: effectiveStart,
    end: effectiveEnd,
  };
}

export {calculateEffectiveBoundaries};

/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
import {setCatchHandler} from 'workbox-routing';
import {matchPrecache} from 'workbox-precaching';

import './_version.js';

export interface OfflineFallbackOptions {
  pageFallback?: string,
  imageFallback?: string,
  fontFallback?: string
}

/**
 * An implementation of the [comprehensive fallbacks recipe]{@link https://developers.google.com/web/tools/workbox/guides/advanced-recipes#comprehensive_fallbacks}. Be sure to include the fallbacks in your precache injection
 * 
 * @memberof module:workbox-recipes
 */
class OfflineFallback {
  /**
   * 
   * @param {Object} [options]
   * @param {string} [options.pageFallback] Precache name to match for pag fallbacks. Defaults to offline.html
   * @param {string} [options.imageFallback] Precache name to match for image fallbacks.
   * * @param {string} [options.fontFallback] Precache name to match for font fallbacks.
   */
  constructor(options: OfflineFallbackOptions = {}) {
    const pageFallback = options.pageFallback || 'offline.html';
    const imageFallback = options.imageFallback || false;
    const fontFallback = options.fontFallback || false;

    setCatchHandler(({event}) => {
      const dest = event.request.destination;

      if (dest === 'document') {
        return matchPrecache(pageFallback);
      }

      if (dest === 'images' && imageFallback !== false) {
        return matchPrecache(imageFallback);
      }

      if (dest === 'font' && fontFallback !== false) {
        return matchPrecache(fontFallback);
      }

      return Response.error();
    });
  }
}

export { OfflineFallback }
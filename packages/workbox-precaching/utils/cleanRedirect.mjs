/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';

/**
 * @param {Response} response
 * @return {Response}
 *
 * @private
 * @memberof module:workbox-precaching
 */
export async function cleanRedirect(response) {
  const clonedResponse = response.clone();

  // Not all browsers support the Response.body stream, so fall back
  // to reading the entire body into memory as a blob.
  const bodyPromise = 'body' in clonedResponse ?
    Promise.resolve(clonedResponse.body) :
    clonedResponse.blob();

  const body = await bodyPromise;

  // new Response() is happy when passed either a stream or a Blob.
  return new Response(body, {
    headers: clonedResponse.headers,
    status: clonedResponse.status,
    statusText: clonedResponse.statusText,
  });
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// Cache a resonse value and clone it instead of re-fetching every time.
let response;

export const generateOpaqueResponse = async () => {
  if (!response) {
    response = await fetch('https://google.com', {mode: 'no-cors'});
  }
  return response.clone();
};

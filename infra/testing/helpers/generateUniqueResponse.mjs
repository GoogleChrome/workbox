/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

let uid = 0;

export const generateUniqueResponse = (responseInit = {}) => {
  return new Response(`${++uid}`, responseInit);
};

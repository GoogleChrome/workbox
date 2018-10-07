/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = async (request) => {
  const response = new Response('Response from mock-fetch.js', {
    status: 200,
    statusText: 'ok.',
  });
  response.url = request.url;
  return response;
};

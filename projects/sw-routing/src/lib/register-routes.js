/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import assert from '../../../../lib/assert';

export default ({routes, defaultRoute, catchHandler}={}) => {
  assert.atLeastOne({routes, defaultRoute});

  self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (!(event.request.method === 'GET' && url.protocol.startsWith('https'))) {
      return;
    }

    let responsePromise;
    for (let route of (routes || [])) {
      if ((route.when)({url, event})) {
        responsePromise = (route.handler)({url, event, configuration: route.configuration});
        break;
      }
    }

    if (!responsePromise && defaultRoute) {
      responsePromise = (defaultRoute.handler)({url, event, configuration: defaultRoute.configuration});
    }
    if (responsePromise && catchHandler) {
      responsePromise = responsePromise.catch(error => catchHandler({url, event, error}));
    }
    if (responsePromise) {
      event.respondWith(responsePromise);
    }
  });
};

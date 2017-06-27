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

import ErrorFactory from '../../../../lib/error-factory';

const errors = {
  'not-in-sw': 'workbox-sw must be loaded in your service worker file.',
  'unsupported-route-type': 'The first parameter to registerRoute() should be' +
    ' either an Express-style path string, a RegExp, or a function.',
  'empty-express-string': 'The Express style route string must have some ' +
    'characters, an empty string is invalid.',
  'bad-revisioned-cache-list': `The 'precache()' method expects` +
    `an array of revisioned urls like so: ['/example/hello.1234.txt', ` +
    `{path: 'hello.txt', revision: '1234'}]`,
  'navigation-route-url-string': `The registerNavigationRoute() method ` +
    `expects a URL string as its first parameter.`,
  'bad-cache-id': `The 'cacheId' parameter must be a string with at least ` +
    `one character`,
  'bad-skip-waiting': `The 'skipWaiting' parameter must be a boolean.`,
  'bad-clients-claim': `The 'clientsClaim' parameter must be a boolean.`,
  'bad-directory-index': `The 'directoryIndex' parameter must be a boolean.`,
};

export default new ErrorFactory(errors);

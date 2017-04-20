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
  'multiple-cache-will-update-plugins': 'You cannot register more than one ' +
    'plugin that implements cacheWillUpdate.',
  'multiple-cache-will-match-plugins': 'You cannot register more than one ' +
    'plugin that implements cacheWillMatch.',
  'invalid-response-for-caching': 'The fetched response could not be cached ' +
    'due to an invalid response code.',
  'no-response-received': 'No response received; falling back to cache.',
  'bad-cache-id': `The 'cacheId' parameter must be a string with at least ` +
    `one character.`,
};

export default new ErrorFactory(errors);

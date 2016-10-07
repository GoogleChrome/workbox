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

export function urlMatches(regExp) {
  assert.isInstance({regExp}, RegExp);
  return ({url}) => url.href.matches(regExp);
}

export function pathEquals(path) {
  assert.isType({path}, 'string');
  return ({url}) => url.origin === self.location.origin && url.pathname === path;
}

export function extensionIsOneOf(extensions) {
  assert.isInstance({extensions}, Array);

  return ({url}) => extensions.includes(url.pathname.split('.').pop());
}

export function headerHasValue({header, value}={}) {
  assert.isType({header}, 'string');
  assert.isType({value}, 'string');

  return ({event}) => event.request.headers.get(header) === value;
}

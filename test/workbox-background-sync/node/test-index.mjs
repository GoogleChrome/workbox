/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

import {expect} from 'chai';
import * as backgroundSync
    from '../../../packages/workbox-background-sync/index.mjs';

describe(`backgroundSync (default export)`, function() {
  it(`should include all public classes on the namespace`, function() {
    expect(backgroundSync).to.have.property('Queue');
  });
});

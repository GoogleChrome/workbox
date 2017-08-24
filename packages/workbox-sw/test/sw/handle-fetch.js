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

import WorkboxSW from '../../src';

describe(`handleFetch Parameter`, function() {
  let stubs = [];
  afterEach(function() {
    stubs.forEach((stub) => stub.restore());
    stubs = [];
  });

  // addEventListener is defined on the EventTarget interface.
  // In order to properly stub out the method without triggering mocha's
  // global leak detection, we need to walk up the inheritance chain to
  // from ServiceWorkerGlobalScope to EventTarget.
  // See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
  it(`should call addEventListener('fetch') by default`, function() {
    const stub = sinon.stub(self.__proto__.__proto__.__proto__, 'addEventListener');
    stubs.push(stub);

    new WorkboxSW();

    expect(stub.calledWith('fetch')).to.be.true;
  });

  it(`should not call addEventListener('fetch') when handleFetch is false`, function() {
    const stub = sinon.stub(self.__proto__.__proto__.__proto__, 'addEventListener');
    stubs.push(stub);

    new WorkboxSW({handleFetch: false});

    expect(stub.calledWith('fetch')).to.be.false;
  });
});

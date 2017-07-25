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

/* eslint-env mocha, browser */

import Route from '../../src/lib/route.js';

describe(`Test of the Route class`, function() {
  const match = () => {};
  const handler = {
    handle: () => {},
  };
  const functionHandler = () => {};
  const method = 'GET';

  const invalidHandler = {};
  const invalidMethod = 'INVALID';

  it(`should throw when Route() is called without any parameters`, function() {
    expect(() => new Route()).to.throw();
  });

  it(`should throw when Route() is called without a valid handler`, function() {
    expect(() => new Route({match})).to.throw();
    expect(() => new Route({match, handler: invalidHandler})).to.throw();
  });

  it(`should throw when Route() is called without a valid match`, function() {
    expect(() => new Route({handler})).to.throw();
  });

  it(`should not throw when Route() is called with valid handler.handle and match parameters`, function() {
    expect(() => new Route({handler, match})).not.to.throw();
  });

  it(`should not throw when Route() is called with a valid function handler and match parameters`, function() {
    expect(() => new Route({handler: functionHandler, match})).not.to.throw();
  });

  it(`should throw when Route() is called with an invalid method`, function() {
    expect(() => new Route({handler, match, method: invalidMethod})).to.throw();
  });

  it(`should use the method provided when Route() is called with a valid method`, function() {
    const route = new Route({handler, match, method});
    expect(route.method).to.equal(method);
  });

  it(`should use a default of GET when Route() is called without a method`, function() {
    const route = new Route({handler, match});
    expect(route.method).to.equal('GET');
  });
});

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

import responsesAreSame from '../../src/lib/responses-are-same.js';

describe(`Test of the responsesAreSame function`, function() {
  const firstHeaderName = 'x-first-header';
  const secondHeaderName = 'x-second-header';
  const headersToCheck = [firstHeaderName, secondHeaderName];

  it(`should throw when responsesAreSame() is called without any parameters`, function() {
    expect(() => {
      responsesAreSame();
    }).to.throw().with.property('name', 'responses-are-same-parameters-required');
  });

  it(`should return true when all the headers match`, function() {
    const first = new Response('', {
      headers: {
        [firstHeaderName]: 'same',
        [secondHeaderName]: 'same',
      },
    });
    const second = new Response('', {
      headers: {
        [firstHeaderName]: 'same',
        [secondHeaderName]: 'same',
      },
    });
    expect(responsesAreSame({
      first,
      second,
      headersToCheck,
    })).to.be.true;
  });

  it(`should return true when only a subset of headers exist, but the existing ones match`, function() {
    const first = new Response('', {
      headers: {
        [firstHeaderName]: 'same',
      },
    });
    const second = new Response('', {
      headers: {
        [firstHeaderName]: 'same',
      },
    });
    expect(responsesAreSame({
      first,
      second,
      headersToCheck,
    })).to.be.true;
  });

  it(`should return true when no headers exist`, function() {
    const first = new Response('');
    const second = new Response('');
    expect(responsesAreSame({
      first,
      second,
      headersToCheck,
    })).to.be.true;
  });

  it(`should return false when one header matches and the other doesn't`, function() {
    const first = new Response('', {
      headers: {
        [firstHeaderName]: 'same',
        [secondHeaderName]: 'same',
      },
    });
    const second = new Response('', {
      headers: {
        [firstHeaderName]: 'same',
        [secondHeaderName]: 'different',
      },
    });
    expect(responsesAreSame({
      first,
      second,
      headersToCheck,
    })).to.be.false;
  });

  it(`should return false when none of the headers match`, function() {
    const first = new Response('', {
      headers: {
        [firstHeaderName]: 'same',
        [secondHeaderName]: 'same',
      },
    });
    const second = new Response('', {
      headers: {
        [firstHeaderName]: 'different',
        [secondHeaderName]: 'different',
      },
    });
    expect(responsesAreSame({
      first,
      second,
      headersToCheck,
    })).to.be.false;
  });
});

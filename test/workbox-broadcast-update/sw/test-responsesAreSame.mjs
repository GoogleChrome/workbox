/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {responsesAreSame} from '../../../packages/workbox-broadcast-update/responsesAreSame.mjs';

describe(`responsesAreSame`, function () {
  const firstHeaderName = 'x-first-header';
  const secondHeaderName = 'x-second-header';
  const headersToCheck = [firstHeaderName, secondHeaderName];

  it(`should throw when responsesAreSame() is called without any parameters`, function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    return expectError(() => {
      responsesAreSame();
    }, 'invalid-responses-are-same-args');
  });

  it(`should return true when all the headers match`, function () {
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
    expect(responsesAreSame(first, second, headersToCheck)).to.be.true;
  });

  it(`should return true when only a subset of headers exist, but the existing ones match`, function () {
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
    expect(responsesAreSame(first, second, headersToCheck)).to.be.true;
  });

  it(`should return true when no headers exist`, function () {
    const first = new Response('');
    const second = new Response('');
    expect(responsesAreSame(first, second, headersToCheck)).to.be.true;
  });

  it(`should return false when one header matches and the other doesn't`, function () {
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
    expect(responsesAreSame(first, second, headersToCheck)).to.be.false;
  });

  it(`should return false when none of the headers match`, function () {
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
    expect(responsesAreSame(first, second, headersToCheck)).to.be.false;
  });
});

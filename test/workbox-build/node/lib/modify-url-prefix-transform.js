/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');
const {
  modifyURLPrefixTransform,
} = require('../../../../packages/workbox-build/build/lib/modify-url-prefix-transform');

describe(`[workbox-build] lib/modify-url-prefix-transform.js`, function () {
  function getManifest() {
    return [
      {
        url: '/first-match/12345/hello',
      },
      {
        url: '/second-match/12345/hello',
      },
    ];
  }

  it(`should handle bad URLs in the manifest`, function () {
    const badInputs = [null, undefined, true, false, {}, []];

    const modifications = {
      '/example-1': '/example-1-altered',
      '/example-2/multi-section/1234': '/example-2-altered/5678',
    };

    const transform = modifyURLPrefixTransform(modifications);
    for (const badInput of badInputs) {
      expect(() => transform([{url: badInput}])).to.throw(
        errors['manifest-entry-bad-url'],
      );
    }
  });

  it(`should handle bad modifyURLPrefixTransform input`, function () {
    const badInputs = [
      null,
      undefined,
      true,
      false,
      [],
      '',
      {
        Hi: [],
      },
    ];

    for (const badInput of badInputs) {
      expect(() => modifyURLPrefixTransform(badInput)).to.throw(
        errors['modify-url-prefix-bad-prefixes'],
      );
    }
  });

  it(`should strip prefixes`, function () {
    const modifications = {
      '/first-match': '',
    };

    const transform = modifyURLPrefixTransform(modifications);
    expect(transform(getManifest())).to.eql({
      manifest: [
        {
          url: '/12345/hello',
        },
        {
          url: '/second-match/12345/hello',
        },
      ],
    });
  });

  it(`should prepend prefixes`, function () {
    const modifications = {
      '': '/public',
    };

    const transform = modifyURLPrefixTransform(modifications);
    expect(transform(getManifest())).to.eql({
      manifest: [
        {
          url: '/public/first-match/12345/hello',
        },
        {
          url: '/public/second-match/12345/hello',
        },
      ],
    });
  });

  it(`should only replace the initial match`, function () {
    const modifications = {
      '/first-match': '/second-match',
      '/second-match': '/third-match',
    };

    const transform = modifyURLPrefixTransform(modifications);
    expect(transform(getManifest())).to.eql({
      manifest: [
        {
          url: '/second-match/12345/hello',
        },
        {
          url: '/third-match/12345/hello',
        },
      ],
    });
  });

  it(`should not replace when the match is not at the start of the URL`, function () {
    const modifications = {
      '/hello': '/altered',
    };

    const transform = modifyURLPrefixTransform(modifications);
    expect(transform(getManifest())).to.eql({manifest: getManifest()});
  });
});

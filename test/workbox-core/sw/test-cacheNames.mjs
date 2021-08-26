/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/cacheNames.mjs';
import {setCacheNameDetails} from 'workbox-core/setCacheNameDetails.mjs';
import generateVariantTests from '../../../infra/testing/generate-variant-tests';

describe(`cacheNames`, function () {
  afterEach(function () {
    // TODO(gauntface): there should be a way to get access to the current
    // (or default) prefix and suffix values so they can be restored here.
    setCacheNameDetails({
      prefix: 'workbox',
      suffix: self.registration.scope,
      precache: 'precache',
      runtime: 'runtime',
      googleAnalytics: 'googleAnalytics',
    });
  });

  it('should return expected defaults', function () {
    // Scope be default is '/' from 'service-worker-mock'
    expect(cacheNames.precache).to.equal(
      `workbox-precache-v2-${self.registration.scope}`,
    );
    expect(cacheNames.runtime).to.equal(
      `workbox-runtime-${self.registration.scope}`,
    );
    expect(cacheNames.prefix).to.equal('workbox');
    expect(cacheNames.suffix).to.equal(self.registration.scope);
  });

  it('should allow customising the prefix', function () {
    setCacheNameDetails({prefix: 'test-prefix'});

    // Scope by default is '/' from 'service-worker-mock'
    expect(cacheNames.precache).to.equal(
      `test-prefix-precache-${self.registration.scope}`,
    );
    expect(cacheNames.runtime).to.equal(
      `test-prefix-runtime-${self.registration.scope}`,
    );
    expect(cacheNames.prefix).to.equal('test-prefix');
  });

  it('should allow customising the suffix', function () {
    setCacheNameDetails({suffix: 'test-suffix'});

    // Scope be default is '/' from 'service-worker-mock'
    expect(cacheNames.precache).to.equal(`workbox-precache-test-suffix`);
    expect(cacheNames.runtime).to.equal(`workbox-runtime-test-suffix`);
    expect(cacheNames.suffix).to.equal('test-suffix');
  });

  it('should allow customising the precache name', function () {
    setCacheNameDetails({precache: 'test-precache'});

    // Scope be default is '/' from 'service-worker-mock'
    expect(cacheNames.precache).to.equal(
      `workbox-test-precache-${self.registration.scope}`,
    );
  });

  it('should allow customising the runtime name', function () {
    setCacheNameDetails({runtime: 'test-runtime'});

    // Scope be default is '/' from 'service-worker-mock'
    expect(cacheNames.precache).to.equal(
      `workbox-precache-${self.registration.scope}`,
    );
    expect(cacheNames.runtime).to.equal(
      `workbox-test-runtime-${self.registration.scope}`,
    );
  });

  it('should allow customising the googleAnalytics name', function () {
    setCacheNameDetails({googleAnalytics: 'test-ga'});

    // Scope be default is '/' from 'service-worker-mock'
    expect(cacheNames.googleAnalytics).to.equal(
      `workbox-test-ga-${self.registration.scope}`,
    );
  });

  it('should allow customising all', function () {
    setCacheNameDetails({
      prefix: 'test-prefix',
      suffix: 'test-suffix',
      precache: 'test-precache',
      runtime: 'test-runtime',
      googleAnalytics: 'test-ga',
    });

    // Scope be default is '/' from 'service-worker-mock'
    expect(cacheNames.precache).to.equal(
      `test-prefix-test-precache-test-suffix`,
    );
    expect(cacheNames.runtime).to.equal(`test-prefix-test-runtime-test-suffix`);
    expect(cacheNames.googleAnalytics).to.equal(
      `test-prefix-test-ga-test-suffix`,
    );
  });

  it('should allow setting prefix and suffix to empty string', function () {
    setCacheNameDetails({
      prefix: '',
      suffix: '',
      precache: 'test-precache',
      runtime: 'test-runtime',
      googleAnalytics: 'test-ga',
    });

    // Scope be default is '/' from 'service-worker-mock'
    expect(cacheNames.precache).to.equal(`test-precache`);
    expect(cacheNames.runtime).to.equal(`test-runtime`);
    expect(cacheNames.googleAnalytics).to.equal(`test-ga`);
  });

  it('should not allow precache to be an empty string in dev', function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    return expectError(() => {
      setCacheNameDetails({
        precache: '',
      });
    }, 'invalid-cache-name');
  });

  it('should not allow runtime to be an empty string in dev', function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    return expectError(() => {
      setCacheNameDetails({
        runtime: '',
      });
    }, 'invalid-cache-name');
  });

  it('should not allow googleAnalytics to be an empty string in dev', function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    return expectError(() => {
      setCacheNameDetails({
        googleAnalytics: '',
      });
    }, 'invalid-cache-name');
  });

  const badValues = [undefined, null, {}, [], true, false];
  generateVariantTests(
    `should handle bad prefix values in dev`,
    badValues,
    function (variant) {
      if (process.env.NODE_ENV === 'production') return this.skip();

      return expectError(() => {
        setCacheNameDetails({
          prefix: variant,
        });
      }, 'incorrect-type');
    },
  );

  generateVariantTests(
    `should handle bad suffix values in dev`,
    badValues,
    function (variant) {
      if (process.env.NODE_ENV === 'production') return this.skip();

      return expectError(() => {
        setCacheNameDetails({
          suffix: variant,
        });
      }, 'incorrect-type');
    },
  );

  generateVariantTests(
    `should handle bad precache values in dev`,
    badValues,
    function (variant) {
      if (process.env.NODE_ENV === 'production') return this.skip();

      return expectError(() => {
        setCacheNameDetails({
          precache: variant,
        });
      }, 'incorrect-type');
    },
  );

  generateVariantTests(
    `should handle bad runtime values in dev`,
    badValues,
    function (variant) {
      if (process.env.NODE_ENV === 'production') return this.skip();

      return expectError(() => {
        setCacheNameDetails({
          runtime: variant,
        });
      }, 'incorrect-type');
    },
  );

  generateVariantTests(
    `should not throw in prod`,
    badValues,
    function (variant) {
      if (process.env.NODE_ENV !== 'production') return this.skip();

      setCacheNameDetails({
        prefix: variant,
        suffix: variant,
        precache: variant,
        runtime: variant,
      });
    },
  );
});

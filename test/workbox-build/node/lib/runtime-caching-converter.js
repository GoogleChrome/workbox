const expect = require('chai').expect;
const sinon = require('sinon');
const vm = require('vm');

const errors = require('../../../../packages/workbox-build/src/lib/errors');
const runtimeCachingConverter = require('../../../../packages/workbox-build/src/lib/runtime-caching-converter');

/**
 * Validates the method calls for a given set of runtimeCachingOptions.
 *
 * @param {Array<Object>} runtimeCachingOptions
 * @param {Array<String>} convertedOptions
 */
function validate(runtimeCachingOptions, convertedOptions) {
  expect(convertedOptions).to.have.lengthOf(runtimeCachingOptions.length);

  const globalScope = {
    workboxSW: {
      router: {
        registerRoute: sinon.spy(),
      },
      strategies: {
        cacheFirst: sinon.spy(),
        cacheOnly: sinon.spy(),
        networkFirst: sinon.spy(),
        networkOnly: sinon.spy(),
        staleWhileRevalidate: sinon.spy(),
      },
    },
  };

  const script = new vm.Script(convertedOptions.join('\n'));
  script.runInNewContext(globalScope);

  runtimeCachingOptions.forEach((runtimeCachingOption, i) => {
    const registerRouteCall = globalScope.workboxSW.router.registerRoute.getCall(i);
    expect(registerRouteCall.args[0]).to.eql(runtimeCachingOption.urlPattern);

    if (runtimeCachingOption.method) {
      expect(registerRouteCall.args[2]).to.eql(runtimeCachingOption.method);
    } else {
      expect(registerRouteCall.args[2]).to.eql('GET');
    }

    if (typeof runtimeCachingOption.handler === 'function') {
      // We can't make assumptions about what custom function handlers will do.
      return;
    }

    const handlerName = runtimeCachingOption.handler === 'fastest' ?
      'staleWhileRevalidate' :
      runtimeCachingOption.handler;
    // This validation assumes that there's only going to be one call to each
    // named strategy per test.
    const strategiesCall = globalScope.workboxSW.strategies[handlerName].firstCall;
    const strategiesOptions = strategiesCall.args[0];

    const expectedOptions = {};
    if (runtimeCachingOption.options) {
      if (runtimeCachingOption.options.networkTimeoutSeconds) {
        expectedOptions.networkTimeoutSeconds = runtimeCachingOption.options.networkTimeoutSeconds;
      }
      if (runtimeCachingOption.options.cache) {
        if (runtimeCachingOption.options.cache.name) {
          expectedOptions.cacheName = runtimeCachingOption.options.cache.name;
        }
        if (runtimeCachingOption.options.cache.maxEntries || runtimeCachingOption.options.cache.maxAgeSeconds) {
          expectedOptions.cacheExpiration = Object.assign({}, runtimeCachingOption.options.cache);
          delete expectedOptions.cacheExpiration.name;
        }
      }
    }

    expect(strategiesOptions).to.eql(expectedOptions);
  });
}

describe(`[workbox-build] src/lib/utils/runtime-caching-converter.js`, function() {
  it(`should throw when urlPattern isn't set`, function() {
    const runtimeCachingOptions = [{
      handler: 'cacheFirst',
    }];

    expect(() => {
      runtimeCachingConverter(runtimeCachingOptions);
    }).to.throw(errors['urlPattern-is-required']);
  });

  it(`should throw when handler isn't set`, function() {
    const runtimeCachingOptions = [{
      urlPattern: /xyz/,
    }];

    expect(() => {
      runtimeCachingConverter(runtimeCachingOptions);
    }).to.throw(errors['handler-string-is-required']);
  });

  it(`should support an empty array of runtimeCaching options`, function() {
    const runtimeCachingOptions = [];
    const convertedOptions = runtimeCachingConverter(runtimeCachingOptions);
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support a single option, using mostly defaults`, function() {
    const runtimeCachingOptions = [{
      urlPattern: /xyz/,
      handler: 'cacheFirst',
    }];

    const convertedOptions = runtimeCachingConverter(runtimeCachingOptions);
    validate(runtimeCachingOptions, convertedOptions);
  });

  // See https://github.com/GoogleChrome/workbox/issues/574#issue-230170963
  it(`should support multiple options, each setting multiple properties`, function() {
    const runtimeCachingOptions = [{
      urlPattern: /abc/,
      handler: 'networkFirst',
      options: {
        networkTimeoutSeconds: 20,
        cache: {
          name: 'abc-cache',
          maxEntries: 5,
          maxAgeSeconds: 50,
        },
      },
    }, {
      urlPattern: /def/,
      handler: 'fastest',
      options: {
        cache: {
          maxEntries: 10,
        },
      },
    }];

    const convertedOptions = runtimeCachingConverter(runtimeCachingOptions);
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support a string urlPattern, using mostly defaults`, function() {
    const runtimeCachingOptions = [{
      urlPattern: '/path/to/file',
      handler: 'cacheFirst',
    }];

    const convertedOptions = runtimeCachingConverter(runtimeCachingOptions);
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support handler being a function`, function() {
    const runtimeCachingOptions = [{
      urlPattern: '/path/to/file',
      handler: () => {},
    }];

    const convertedOptions = runtimeCachingConverter(runtimeCachingOptions);
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support registering non-GET methods`, function() {
    const runtimeCachingOptions = [{
      urlPattern: '/path/to/file',
      handler: 'cacheFirst',
      method: 'POST',
    }];

    const convertedOptions = runtimeCachingConverter(runtimeCachingOptions);
    validate(runtimeCachingOptions, convertedOptions);
  });
});

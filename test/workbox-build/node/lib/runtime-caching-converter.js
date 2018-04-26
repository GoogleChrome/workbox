const expect = require('chai').expect;
const sinon = require('sinon');
const vm = require('vm');

const errors = require('../../../../packages/workbox-build/src/lib/errors');
const runtimeCachingConverter = require('../../../../packages/workbox-build/src/lib/runtime-caching-converter');

/**
 * Validates the method calls for a given set of runtimeCachingOptions.
 *
 * @private
 * @param {Array<Object>} runtimeCachingOptions
 * @param {Array<string>} convertedOptions
 */
function validate(runtimeCachingOptions, convertedOptions) {
  expect(convertedOptions).to.have.lengthOf(runtimeCachingOptions.length);

  const globalScope = {
    workbox: {
      cacheableResponse: {
        Plugin: sinon.spy(),
      },
      expiration: {
        Plugin: sinon.spy(),
      },
      backgroundSync: {
        Plugin: sinon.spy(),
      },
      broadcastUpdate: {
        Plugin: sinon.spy(),
      },
      routing: {
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
    const registerRouteCall = globalScope.workbox.routing.registerRoute.getCall(i);
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

    // This validation assumes that there's only going to be one call to each
    // named strategy per test.
    const strategiesCall = globalScope.workbox.strategies[runtimeCachingOption.handler].firstCall;
    const strategiesOptions = strategiesCall.args[0];

    if (runtimeCachingOption.options) {
      const options = runtimeCachingOption.options;
      if (options.networkTimeoutSeconds) {
        expect(options.networkTimeoutSeconds)
          .to.eql(strategiesOptions.networkTimeoutSeconds);
      }

      if (options.cacheName) {
        expect(options.cacheName).to.eql(strategiesOptions.cacheName);
      }

      if (Object.keys(options.expiration).length > 0) {
        expect(globalScope.workbox.expiration.Plugin.calledWith(options.expiration)).to.be.true;
      }

      if (options.cacheableResponse) {
        expect(globalScope.workbox.cacheableResponse.Plugin.calledWith(options.cacheableResponse)).to.be.true;
      }

      if (options.backgroundSync) {
        if ('options' in options.backgroundSync) {
          expect(
            globalScope.workbox.backgroundSync.Plugin.calledWith(
              options.backgroundSync.name, options.backgroundSync.options)
          ).to.be.true;
        } else {
          expect(
            globalScope.workbox.backgroundSync.Plugin.calledWith(
              options.backgroundSync.name)
          ).to.be.true;
        }
      }

      if (options.broadcastUpdate) {
        if ('options' in options.broadcastUpdate) {
          expect(
            globalScope.workbox.broadcastUpdate.Plugin.calledWith(
              options.broadcastUpdate.channelName, options.broadcastUpdate.options)
          ).to.be.true;
        } else {
          expect(
            globalScope.workbox.broadcastUpdate.Plugin.calledWith(
              options.broadcastUpdate.channelName)
          ).to.be.true;
        }
      }
    }
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

  it(`should support a single option with a RegExp urlPattern, using mostly defaults`, function() {
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
        cacheName: 'abc-cache',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 50,
        },
        broadcastUpdate: {
          channelName: 'test',
        },
        backgroundSync: {
          name: 'test',
        },
      },
    }, {
      urlPattern: '/test',
      handler: 'staleWhileRevalidate',
      options: {
        expiration: {
          maxEntries: 10,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
        broadcastUpdate: {
          channelName: 'test',
          options: {
            source: 'test-source',
          },
        },
        backgroundSync: {
          name: 'test',
          options: {
            maxRetentionTime: 123,
          },
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
      urlPattern: /abc/,
      handler: () => {},
    }];

    const convertedOptions = runtimeCachingConverter(runtimeCachingOptions);
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support registering non-GET methods`, function() {
    const runtimeCachingOptions = [{
      urlPattern: /abc/,
      handler: 'cacheFirst',
      method: 'POST',
    }];

    const convertedOptions = runtimeCachingConverter(runtimeCachingOptions);
    validate(runtimeCachingOptions, convertedOptions);
  });
});

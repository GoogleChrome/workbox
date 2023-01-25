/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const sinon = require('sinon');
const vm = require('vm');

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');
const {
  ModuleRegistry,
} = require('../../../../packages/workbox-build/build/lib/module-registry');
const {
  runtimeCachingConverter,
} = require('../../../../packages/workbox-build/build/lib/runtime-caching-converter');

const moduleRegistry = new ModuleRegistry();

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
    workbox_cacheable_response_CacheableResponsePlugin: sinon.spy(),
    workbox_expiration_ExpirationPlugin: sinon.spy(),
    workbox_background_sync_BackgroundSyncPlugin: sinon.spy(),
    workbox_broadcast_update_BroadcastUpdatePlugin: sinon.spy(),
    workbox_precaching_PrecacheFallbackPlugin: sinon.spy(),
    workbox_range_requests_RangeRequestsPlugin: sinon.spy(),
    workbox_routing_registerRoute: sinon.spy(),
    workbox_strategies_CacheFirst: sinon.spy(),
    workbox_strategies_CacheOnly: sinon.spy(),
    workbox_strategies_NetworkFirst: sinon.spy(),
    workbox_strategies_NetworkOnly: sinon.spy(),
    workbox_strategies_StaleWhileRevalidate: sinon.spy(),
  };

  // Make it easier to find the right spy given a handler name.
  const handlerMapping = {
    CacheFirst: globalScope.workbox_strategies_CacheFirst,
    CacheOnly: globalScope.workbox_strategies_CacheOnly,
    NetworkFirst: globalScope.workbox_strategies_NetworkFirst,
    NetworkOnly: globalScope.workbox_strategies_NetworkOnly,
    StaleWhileRevalidate: globalScope.workbox_strategies_StaleWhileRevalidate,
  };

  const script = new vm.Script(convertedOptions.join('\n'));
  script.runInNewContext(globalScope);
  runtimeCachingOptions.forEach((runtimeCachingOption, i) => {
    const registerRouteCall =
      globalScope.workbox_routing_registerRoute.getCall(i);
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
    const strategiesCall =
      handlerMapping[runtimeCachingOption.handler].firstCall;
    const strategiesOptions = strategiesCall.args[0];

    if (runtimeCachingOption.options) {
      const options = runtimeCachingOption.options;
      if (options.networkTimeoutSeconds) {
        expect(options.networkTimeoutSeconds).to.eql(
          strategiesOptions.networkTimeoutSeconds,
        );
      }

      if (options.cacheName) {
        expect(options.cacheName).to.eql(strategiesOptions.cacheName);
      }

      if (options.fetchOptions) {
        expect(options.fetchOptions).to.deep.eql(
          strategiesOptions.fetchOptions,
        );
      }

      if (options.matchOptions) {
        expect(options.matchOptions).to.deep.eql(
          strategiesOptions.matchOptions,
        );
      }

      if (Object.keys(options.expiration).length > 0) {
        expect(
          globalScope.workbox_expiration_ExpirationPlugin.calledWith(
            options.expiration,
          ),
        ).to.be.true;
      }

      if (options.cacheableResponse) {
        expect(
          globalScope.workbox_cacheable_response_CacheableResponsePlugin.calledWith(
            options.cacheableResponse,
          ),
        ).to.be.true;
      }

      if (options.precacheFallback) {
        expect(
          globalScope.workbox_precaching_PrecacheFallbackPlugin.calledWith(
            options.precacheFallback,
          ),
        ).to.be.true;
      }

      if (options.rangeRequests) {
        expect(
          globalScope.workbox_range_requests_RangeRequestsPlugin.calledWith(),
        ).to.be.true;
      }

      if (options.backgroundSync) {
        if ('options' in options.backgroundSync) {
          expect(
            globalScope.workbox_background_sync_BackgroundSyncPlugin.calledWith(
              options.backgroundSync.name,
              options.backgroundSync.options,
            ),
          ).to.be.true;
        } else {
          expect(
            globalScope.workbox_background_sync_BackgroundSyncPlugin.calledWith(
              options.backgroundSync.name,
            ),
          ).to.be.true;
        }
      }

      if (options.broadcastUpdate) {
        if ('options' in options.broadcastUpdate) {
          const expectedOptions = Object.assign(
            {channelName: options.broadcastUpdate.channelName},
            options.broadcastUpdate.options,
          );
          expect(
            globalScope.workbox_broadcast_update_BroadcastUpdatePlugin.calledWith(
              expectedOptions,
            ),
          ).to.be.true;
        } else {
          expect(
            globalScope.workbox_broadcast_update_BroadcastUpdatePlugin.calledWith(
              {channelName: options.broadcastUpdate.channelName},
            ),
          ).to.be.true;
        }
      }
    }
  });
}

describe(`[workbox-build] src/lib/utils/runtime-caching-converter.js`, function () {
  it(`should throw when urlPattern isn't set`, function () {
    const runtimeCachingOptions = [
      {
        handler: 'CacheFirst',
      },
    ];

    expect(() => {
      runtimeCachingConverter(moduleRegistry, runtimeCachingOptions);
    }).to.throw(errors['urlPattern-is-required']);
  });

  it(`should throw when handler isn't set`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: /xyz/,
      },
    ];

    expect(() => {
      runtimeCachingConverter(moduleRegistry, runtimeCachingOptions);
    }).to.throw(errors['handler-string-is-required']);
  });

  it(`should support an empty array of runtimeCaching options`, function () {
    const runtimeCachingOptions = [];
    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support a single option with a RegExp urlPattern, using mostly defaults`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: /xyz/,
        handler: 'CacheFirst',
      },
    ];

    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    validate(runtimeCachingOptions, convertedOptions);
  });

  // See https://github.com/GoogleChrome/workbox/issues/574#issue-230170963
  it(`should support multiple options, each setting multiple properties`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: /abc/,
        handler: 'NetworkFirst',
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
          precacheFallback: {
            fallbackURL: '/test1',
          },
          rangeRequests: false,
          fetchOptions: {
            headers: {
              Custom: 'Header',
            },
          },
        },
      },
      {
        urlPattern: '/test',
        handler: 'StaleWhileRevalidate',
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
          rangeRequests: true,
          precacheFallback: {
            fallbackURL: '/test2',
          },
          matchOptions: {
            ignoreSearch: true,
          },
        },
      },
    ];

    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support a string urlPattern, using mostly defaults`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: '/path/to/file',
        handler: 'CacheFirst',
      },
    ];

    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support handler being a function`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: /abc/,
        handler: () => {},
      },
    ];

    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support registering non-GET methods`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: /abc/,
        handler: 'CacheFirst',
        method: 'POST',
      },
    ];

    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    validate(runtimeCachingOptions, convertedOptions);
  });

  it(`should support custom plugins`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: /abc/,
        handler: 'CacheFirst',
        options: {
          plugins: [
            {
              cacheWillUpdate: async ({request, response}) => {
                return response;
              },
              cacheDidUpdate: async ({
                cacheName,
                request,
                oldResponse,
                newResponse,
              }) => {},
              cachedResponseWillBeUsed: async ({
                cacheName,
                request,
                matchOptions,
                cachedResponse,
              }) => {
                return cachedResponse;
              },
              requestWillFetch: async ({request}) => {
                return request;
              },
              fetchDidFail: async ({originalRequest, request, error}) => {},
            },
          ],
        },
      },
    ];

    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    expect(convertedOptions[0].includes('cacheWillUpdate: async')).to.true;
    expect(convertedOptions[0].includes('cacheDidUpdate: async')).to.true;
    expect(convertedOptions[0].includes('cachedResponseWillBeUsed: async')).to
      .true;
    expect(convertedOptions[0].includes('requestWillFetch: async')).to.true;
    expect(convertedOptions[0].includes('fetchDidFail: async')).to.true;
  });

  it(`should strip comments on custom plugins`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: /abc/,
        handler: 'CacheFirst',
        options: {
          plugins: [
            {
              cacheWillUpdate: async ({request, response}) => {
                // Commenting
                return response;
              },
              cachedResponseWillBeUsed: async ({
                cacheName,
                request,
                matchOptions,
                cachedResponse,
              }) => {
                /* Commenting */
                return cachedResponse;
              },
            },
          ],
        },
      },
    ];

    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    expect(convertedOptions[0].includes('// Commenting')).to.false;
    expect(convertedOptions[0].includes('/* Commenting */')).to.false;
  });

  it(`should keep contents with // that are not comments`, function () {
    const runtimeCachingOptions = [
      {
        urlPattern: /abc/,
        handler: 'CacheFirst',
        options: {
          plugins: [
            {
              cacheWillUpdate: async ({request, response}) => {
                // Commenting

                if (request.url === 'https://test.com') {
                  return null;
                }

                return response;
              },
            },
          ],
        },
      },
    ];

    const convertedOptions = runtimeCachingConverter(
      moduleRegistry,
      runtimeCachingOptions,
    );
    expect(convertedOptions[0].includes('// Commenting')).to.false;
    expect(convertedOptions[0].includes('https://test.com')).to.true;
  });
});

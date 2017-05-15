const proxyquire = require('proxyquire');

describe('CLI Flags', function() {
  it('should merge config and override with flag input', function() {
    const configFile = {
      globDirectory: 'build/',
      staticFileGlobs: [
        '**/*.{js,txt}',
      ],
      swDest: 'build/sw.js',
      globIgnores: [
        'sw.js',
      ],
    };
    const flags = {
      cacheId: 'input-cache-id',
      clientsClaim: true,
      directoryIndex: '/example-index.html',
      handleFetch: 'false',
      maximumFileSizeToCacheInBytes: 2000,
      navigateFallback: '/shell',
      skipWaiting: 'true',
    };

    const SWCli = proxyquire('../../build/index', {
      './lib/utils/get-config': () => {
        return Promise.resolve(configFile);
      },
      'workbox-build': {
        generateSW: (config) => {
          config.should.deep.equal(Object.assign(config, flags));
          return Promise.resolve();
        },
      },
    });

    const cli = new SWCli();
    return cli.handleCommand('generate:sw', null, flags);
  });
});

import {expect} from 'chai';
import sinon from 'sinon';
import generateTestVariants from '../../../infra/testing/generate-variant-tests';
import WorkboxSW from '../../../packages/workbox-sw/controllers/WorkboxSW.mjs';

const fakeWorkbox = {
  core: {
    default: {
      msg: 'workbox-core',
    },
  },
  precaching: {
    default: {
      msg: 'workbox-precaching',
    },
  },
  strategies: {
    example1: {
      msg: 'workbox-strategies-1',
    },
    example2: {
      msg: 'workbox-strategies-2',
    },
  },
};

describe(`[workbox-sw] WorkboxSW`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
    delete self.workbox;

    sandbox.stub(self, 'importScripts').callsFake((url) => {
      if (url.includes('workbox-core')) {
        self.workbox.core = fakeWorkbox.core;
      }
      if (url.includes('workbox-precaching')) {
        self.workbox.precaching = fakeWorkbox.precaching;
      }
      if (url.includes('workbox-strategies')) {
        self.workbox.strategies = fakeWorkbox.strategies;
      }
    });
  });

  after(function() {
    sandbox.restore();
    delete self.workbox;
  });

  describe(`constructor`, function() {
    it(`should construct with expect defaults`, function() {
      self.workbox = new WorkboxSW();
      expect(self.workbox._options).to.deep.equal({
        debug: false,
        modulePathPrefix: null,
        modulePathCb: null,
      });
    });

    it(`should construct debug true when on localhost`, function() {
      sandbox.stub(self, 'location').value({
        hostname: 'localhost',
      });

      self.workbox = new WorkboxSW();
      expect(self.workbox._options.debug).to.deep.equal(true);
    });
  });

  describe(`setConfig`, function() {
    it(`should override default config options`, function() {
      const cb = () => {};
      self.workbox = new WorkboxSW();

      self.workbox.setConfig({
        debug: true,
        modulePathPrefix: 'http://custom-cdn.example.com/workbox-modules/v1.0.0/',
        modulePathCb: cb,
      });
      expect(self.workbox._options).to.deep.equal({
        debug: true,
        modulePathPrefix: 'http://custom-cdn.example.com/workbox-modules/v1.0.0/',
        modulePathCb: cb,
      });
    });

    it(`should throw when invoking config after loading a module`, function() {
      self.workbox = new WorkboxSW();

      expect(() => {
        self.workbox.setConfig({
          modulePathPrefix: 'http://custom-cdn.example.com/workbox-modules/v1.0.0/',
        });
      }).not.to.throw();

      // Accessing .core loads workbox-core.
      self.workbox.core;

      expect(() => {
        self.workbox.setConfig({
          modulePathPrefix: 'http://custom-cdn.example.com/workbox-modules/v2.0.0/',
        });
      }).to.throw();
    });

    it(`should not throw on no config and environment should stay the same`, function() {
      self.workbox = new WorkboxSW();

      const originalOptions = self.workbox._options;

      self.workbox.setConfig();

      expect(self.workbox._options).to.equal(originalOptions);
    });
  });

  describe(`skipWaiting`, function() {
    it('should add event listener and call skipWaiting', function(done) {
      const skipWaitingSpy = sandbox.spy(self, 'skipWaiting');

      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        expect(eventName).to.equal('install');

        cb();

        expect(skipWaitingSpy.callCount).to.equal(1);
        done();
      });

      self.workbox = new WorkboxSW();
      self.workbox.skipWaiting();
    });
  });

  describe(`clientsClaim`, function() {
    it('should add event listener and call clientsClaim', function(done) {
      const clientsClaimSpy = sandbox.spy(self.clients, 'claim');

      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        expect(eventName).to.equal('activate');

        cb();

        expect(clientsClaimSpy.callCount).to.equal(1);
        done();
      });

      self.workbox = new WorkboxSW();
      self.workbox.clientsClaim();
    });
  });

  describe(`get`, function() {
    it(`should print error message when importScripts fails`, function() {
      const errorMessage = 'Injected error.';
      self.importScripts.restore();
      sandbox.stub(self, 'importScripts').throws(new Error(errorMessage));
      sandbox.stub(console, 'error').callsFake((errMsg) => {
        expect(errMsg.includes('workbox-core')).to.be.true;
        expect(errMsg.includes(
            'WORKBOX_CDN_ROOT_URL/workbox-core.prod.js')).to.be.true;
      });

      try {
        self.workbox = new WorkboxSW();

        // Accessing .core loads workbox-core.
        self.workbox.core;

        throw new Error('No error thrown.');
      } catch (err) {
        expect(err.message).to.equal(errorMessage);
      }
    });

    it(`should use modulePathCb to load modules if provided`, function() {
      const callbackSpy = sandbox.spy((moduleName, debug) => {
        return `/custom-path/${moduleName}/${debug}`;
      });

      self.workbox = new WorkboxSW();
      self.workbox.setConfig({
        debug: true,
        modulePathCb: callbackSpy,
      });

      // Accessing .core loads workbox-core.
      self.workbox.core;

      expect(callbackSpy.callCount).to.equal(1);
      expect(callbackSpy.args[0]).to.deep.equal(['workbox-core', true]);
      expect(self.importScripts.args[0]).to.deep.equal(['/custom-path/workbox-core/true']);
    });

    const modulePathVariations = [
      {
        prefix: '/',
        expectedImport: '/workbox-core.dev.js',
      }, {
        prefix: '/custom-path',
        expectedImport: '/custom-path/workbox-core.dev.js',
      }, {
        prefix: '/custom-path/',
        expectedImport: '/custom-path/workbox-core.dev.js',
      }, {
        prefix: 'custom-path/',
        expectedImport: 'custom-path/workbox-core.dev.js',
      }, {
        prefix: 'custom-path',
        expectedImport: 'custom-path/workbox-core.dev.js',
      }, {
        prefix: 'custom-path/with/directories/',
        expectedImport: 'custom-path/with/directories/workbox-core.dev.js',
      }, {
        prefix: 'custom-path/with/directories',
        expectedImport: 'custom-path/with/directories/workbox-core.dev.js',
      }, {
        prefix: '/custom-path/with/directories',
        expectedImport: '/custom-path/with/directories/workbox-core.dev.js',
      },
    ];
    generateTestVariants(`should import using modulePathPrefix`, modulePathVariations, async function(variant) {
      self.workbox = new WorkboxSW();

      self.workbox.setConfig({
        debug: true,
        modulePathPrefix: variant.prefix,
      });

      // Accessing .core loads workbox-core.
      self.workbox.core;

      expect(self.importScripts.args[0]).to.deep.equal([variant.expectedImport]);
    });
  });

  describe(`get core`, function() {
    it(`should return core.default`, function() {
      self.workbox = new WorkboxSW();
      expect(self.workbox.core).to.equal(fakeWorkbox.core);
    });
  });

  describe(`get precaching`, function() {
    it(`should return precaching`, function() {
      self.workbox = new WorkboxSW();
      expect(self.workbox.precaching).to.equal(fakeWorkbox.precaching);
    });
  });

  describe(`get strategies`, function() {
    it(`should return all of strategies`, function() {
      self.workbox = new WorkboxSW();
      expect(self.workbox.strategies).to.equal(fakeWorkbox.strategies);
    });
  });
});

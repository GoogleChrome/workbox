import {expect} from 'chai';
import sinon from 'sinon';

import generateTestVariants from '../../../infra/testing/generate-variant-tests';
import constants from '../../../gulp-tasks/utils/constants';

import WorkboxSW from '../../../packages/workbox-sw/index.mjs';

describe(`[workbox-sw] WorkboxSW`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
    delete global.workbox;
  });

  after(function() {
    sandbox.restore();
    delete global.workbox;
  });

  describe(`constructor`, function() {
    it(`should construct with no input and have expected defaults`, function() {
      const wb = new WorkboxSW();
      expect(wb._options).to.deep.equal({
        debug: false,
        modulePathPrefix: null,
        modulePathCb: null,
        disableModuleImports: false,
      });
    });

    it(`should construct debug true when on localhost`, function() {
      sandbox.stub(self, 'location').value({
        hostname: 'localhost',
      });

      const wb = new WorkboxSW();
      expect(wb._options.debug).to.deep.equal(true);
    });

    it(`should use provided options`, function() {
      const cb = () => {};
      const wb = new WorkboxSW({
        debug: true,
        modulePathPrefix: 'http://custom-cdn.example.com/workbox-modules/v1.0.0/',
        modulePathCb: cb,
        disableModuleImports: true,
      });
      expect(wb._options).to.deep.equal({
        debug: true,
        modulePathPrefix: 'http://custom-cdn.example.com/workbox-modules/v1.0.0/',
        modulePathCb: cb,
        disableModuleImports: true,
      });
    });

    it(`should load workbox-core on construction`, function() {
      sandbox.stub(global, 'importScripts');
      sandbox.spy(WorkboxSW.prototype, 'loadModule');

      // TODO Switch to contstants.BUILD_TYPES.prod
      const wb = new WorkboxSW({
        debug: process.env.NODE_ENV !== constants.BUILD_TYPES.prod,
      });

      expect(wb.loadModule.callCount).to.equal(1);
      expect(global.importScripts.callCount).to.equal(1);
      expect(global.importScripts.args[0]).to.deep.equal([`WORKBOX_CDN_ROOT_URL/workbox-core.${process.env.NODE_ENV.slice(0, 4)}.js`]);
    });

    it(`should not load workbox-core if disableModulesImports is true`, function() {
      sandbox.stub(WorkboxSW.prototype, 'loadModule');

      const wb = new WorkboxSW({
        disableModuleImports: true,
      });

      expect(wb.loadModule.callCount).to.equal(0);
    });

    it(`should use module cb to load workbox-core if a function is provided`, function() {
      sandbox.stub(global, 'importScripts');
      const callbackSpy = sandbox.spy((moduleName, debug) => {
        return `/custom-path/${moduleName}/${debug}`;
      });

      new WorkboxSW({
        debug: true,
        modulePathCb: callbackSpy,
      });

      expect(callbackSpy.callCount).to.equal(1);
      expect(callbackSpy.args[0]).to.deep.equal(['workbox-core', true]);
      expect(global.importScripts.args[0]).to.deep.equal(['/custom-path/workbox-core/true']);
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
      sandbox.stub(global, 'importScripts');

      new WorkboxSW({
        debug: true,
        modulePathPrefix: variant.prefix,
      });

      expect(global.importScripts.args[0]).to.deep.equal([variant.expectedImport]);
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

      const wb = new WorkboxSW();
      wb.skipWaiting();
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

      const wb = new WorkboxSW();
      wb.clientsClaim();
    });
  });

  describe(`loadModule()`, function() {
    it(`should throw when loading module while disableModuleImports is true`, function() {
      const wb = new WorkboxSW({
        disableModuleImports: true,
      });
      expect(() => {
        wb.loadModule('should-throw');
      }).to.throw(`disableModuleImports`);
    });

    it(`should print error message when importScripts fails`, function() {
      const errorMessage = 'Injected error.';
      sandbox.stub(global, 'importScripts').callsFake(() => {
        throw new Error(errorMessage);
      });
      sandbox.stub(console, 'error').callsFake((errMsg) => {
        expect(errMsg.indexOf('workbox-core')).to.not.equal(-1);
        expect(errMsg.indexOf(
          'WORKBOX_CDN_ROOT_URL/workbox-core.prod.js'
        )).to.not.equal(-1);
      });

      try {
        new WorkboxSW();
        throw new Error('No error thrown.');
      } catch (err) {
        expect(err.message).to.equal(errorMessage);
      }
    });
  });

  describe(`get core`, function() {
    it(`should return core.default`, function() {
      const fakeWorkbox = {
        core: {
          default: {},
        },
      };
      sandbox.stub(WorkboxSW.prototype, 'loadModule').callsFake(() => {
        global.workbox = fakeWorkbox;
      });

      const wb = new WorkboxSW();
      expect(wb.core).to.equal(fakeWorkbox.core.default);
    });
  });

  describe(`get precaching`, function() {
    it(`should return precaching.default`, function() {
      const fakeWorkbox = {
        precaching: {
          default: {},
        },
      };
      sandbox.stub(WorkboxSW.prototype, 'loadModule').callsFake((moduleName) => {
        if (moduleName === 'workbox-precaching') {
          global.workbox = fakeWorkbox;
        }
      });

      const wb = new WorkboxSW();
      expect(wb.precaching).to.equal(fakeWorkbox.precaching.default);
    });
  });
});

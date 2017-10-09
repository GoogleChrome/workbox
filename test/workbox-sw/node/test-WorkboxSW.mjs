import {expect} from 'chai';
import sinon from 'sinon';

import WorkboxSW from '../../../packages/workbox-sw/index.mjs';

describe(`[workbox-sw] WorkboxSW`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
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
      sandbox.stub(WorkboxSW.prototype, 'loadModule');

      const wb = new WorkboxSW();

      expect(wb.loadModule.callCount).to.equal(1);
      expect(wb.loadModule.args[0]).to.deep.equal(['workbox-core']);
    });

    it(`should not load workbox-core if disableModulesImports is true`, function() {
      sandbox.stub(WorkboxSW.prototype, 'loadModule');

      const wb = new WorkboxSW({
        disableModuleImports: true,
      });

      expect(wb.loadModule.callCount).to.equal(0);
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
});

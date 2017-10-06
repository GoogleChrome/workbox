import {expect} from 'chai';
import sinon from 'sinon';

import {WorkboxSW} from '../../../packages/workbox-sw/index.mjs';

describe(`[workbox-sw] WorkboxSW`, function() {
  let sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct with no input and have expected defaults`, function() {
      const wb = new WorkboxSW();
      expect(wb._options).to.deep.equal({
        debug: false,
        pathPrefix: null,
      });
    });

    it(`should construct debug true when on localhost`, function() {
      sandbox.stub(self, 'location').value({
        hostname: 'localhost',
      });

      const wb = new WorkboxSW();
      expect(wb._options).to.deep.equal({
        debug: true,
        pathPrefix: null,
      });
    });

    it(`should use provided options when provided`, function() {
      const wb = new WorkboxSW({
        debug: true,
        pathPrefix: 'http://custom-cdn.example.com/workbox-modules/v1.0.0/',
      });
      expect(wb._options).to.deep.equal({
        debug: true,
        pathPrefix: 'http://custom-cdn.example.com/workbox-modules/v1.0.0/',
      });
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

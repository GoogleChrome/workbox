/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import sinon from 'sinon';
import generateTestVariants from '../../../infra/testing/generate-variant-tests';
import {WorkboxSW} from '../../../packages/workbox-sw/controllers/WorkboxSW.mjs';
import {getPackages} from '../../../gulp-tasks/utils/get-packages';
import {outputFilenameToPkgMap} from '../../../gulp-tasks/utils/output-filename-to-package-map';


describe(`[workbox-sw] WorkboxSW`, function() {
  let sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
    delete self.workbox;

    sandbox.stub(self, 'importScripts').callsFake((url) => {
      // This auto generates a value for self.workbox.<namespace>
      const match = /WORKBOX_CDN_ROOT_URL\/(.*)\.(?:dev|prod)\.js/.exec(url);
      if (!match) {
        return;
      }

      const outputFilename = match[1];
      const pkg = outputFilenameToPkgMap[outputFilename];

      const namespace = pkg.workbox.browserNamespace.split('.')[1];
      self.workbox[namespace] = {
        injectedMsg: `Injected value for ${pkg.name}.`,
      };
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

  getPackages({type: 'browser'}).forEach((pkg) => {
    // Don't test workbox-sw, which exports the `workbox` namespace.
    if (pkg.workbox.browserNamespace === 'workbox') return;

    describe(`get ${pkg.workbox.browserNamespace}`, function() {
      it(`should return ${pkg.workbox.browserNamespace}`, function() {
        const namespace = pkg.workbox.browserNamespace.split('.')[1];
        self.workbox = new WorkboxSW();
        expect(self.workbox[namespace]).to.exist;
        expect(self.workbox[namespace].injectedMsg).to.exist;
      });
    });
  });
});

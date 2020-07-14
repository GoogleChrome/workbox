/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {precache} from 'workbox-precaching/precache.mjs';
import {PrecacheFallbackPlugin} from 'workbox-precaching/PrecacheFallbackPlugin.mjs';
import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';

describe(`PrecacheFallbackPlugin`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.stub(self, 'addEventListener');
    resetDefaultPrecacheController();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct a properly-configured PrecacheFallbackPlugin instance`, function() {
      const fallbackURL = '/test/url';
      const precacheFallbackPlugin = new PrecacheFallbackPlugin({fallbackURL});

      expect(precacheFallbackPlugin._fallbackURL).to.eql(fallbackURL);
    });

    it(`should expose a handlerDidError method`, function() {
      const fallbackURL = '/test/url';
      const precacheFallbackPlugin = new PrecacheFallbackPlugin({fallbackURL});

      expect(precacheFallbackPlugin).to.respondTo('handlerDidError');
    });
  });

  describe(`handlerDidError`, function() {
    it(`should return the matchPrecache value for the fallbackURL`, async function() {
      const body = 'test body';
      const fallbackURL = '/test/url';
      const revision = 'abcd1234';

      const matchStub = sandbox.stub().resolves(new Response(body));
      sandbox.stub(self.caches, 'open').resolves({
        match: matchStub,
      });

      precache([{
        revision,
        url: fallbackURL,
      }]);

      const precacheFallbackPlugin = new PrecacheFallbackPlugin({fallbackURL});

      const response = await precacheFallbackPlugin.handlerDidError();
      const responseBody = await response.text();

      expect(responseBody).to.eql(body);

      const expectedURL = new URL(fallbackURL, location.href);
      expectedURL.searchParams.set('__WB_REVISION__', revision);
      expect(matchStub.args).to.eql([[expectedURL.href]]);
    });
  });
});

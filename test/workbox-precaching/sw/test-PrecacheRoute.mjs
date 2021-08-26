/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {PrecacheController} from 'workbox-precaching/PrecacheController.mjs';
import {PrecacheRoute} from 'workbox-precaching/PrecacheRoute.mjs';

function createMatchParams(path) {
  const request = new Request(path);
  const url = new URL(request.url);
  const event = new FetchEvent('event', {request});
  return {request, url, event};
}

describe(`PrecacheRoute()`, function () {
  describe(`.match`, function () {
    it(`should only match precached urls`, async function () {
      const pc = new PrecacheController();

      pc.addToCacheList([
        {url: '/one', revision: '123'},
        {url: '/two', revision: '234'},
      ]);

      const pr = new PrecacheRoute(pc);

      // Precached URLs
      expect(pr.match(createMatchParams('/one'))).to.be.ok;
      expect(pr.match(createMatchParams('/two'))).to.be.ok;

      // Not precached URLs.
      expect(pr.match(createMatchParams('/three'))).to.not.be.ok;
    });

    it(`matches precached urls with ignored params`, async function () {
      const pc = new PrecacheController();
      pc.addToCacheList([`/?a=1&b=2`]);

      const prWithIgnore = new PrecacheRoute(pc, {
        ignoreURLParametersMatching: [/ignore/],
      });
      const prWithoutIgnore = new PrecacheRoute(pc);

      expect(prWithIgnore.match(createMatchParams('/?a=1&ignore=me&b=2'))).to.be
        .ok;
      expect(prWithIgnore.match(createMatchParams('/?a=1&ignore=me&b=3'))).to
        .not.be.ok;
      expect(prWithoutIgnore.match(createMatchParams('/?a=1&ignore=me&b=2'))).to
        .not.be.ok;
    });

    // Should we sort the search params to ensure that matches are consistent?
    it.skip(`should match search params out of order`, async function () {
      const pc = new PrecacheController();
      pc.addToCacheList([`/?a=1&b=2`]);

      const prWithIgnore = new PrecacheRoute(pc, {
        ignoreURLParametersMatching: [/ignore/],
      });
      const prWithoutIgnore = new PrecacheRoute(pc);

      expect(prWithIgnore.match(createMatchParams('/?b=2&ignore=me&a=1'))).to.be
        .ok;
      expect(prWithoutIgnore.match(createMatchParams('/?b=2&ignore=me&a=1'))).to
        .be.ok;
    });

    it(`should use the directoryIndex if the original request fails to match a cached URL`, async function () {
      const pc = new PrecacheController();
      pc.addToCacheList([`/test-index.html`]);

      const prWithIndex = new PrecacheRoute(pc, {
        directoryIndex: 'test-index.html',
      });
      const prWithoutIndex = new PrecacheRoute(pc);

      expect(prWithIndex.match(createMatchParams('/'))).to.be.ok;
      expect(prWithoutIndex.match(createMatchParams('/'))).to.not.be.ok;
    });

    it(`should use the default directoryIndex of 'index.html'`, async function () {
      const pc = new PrecacheController();
      pc.addToCacheList([`/index.html`]);

      const pr = new PrecacheRoute(pc);

      expect(pr.match(createMatchParams('/'))).to.be.ok;
    });

    it(`should use the cleanURLs of 'about.html'`, async function () {
      const pc = new PrecacheController();
      pc.addToCacheList([`/about.html`]);

      const pr = new PrecacheRoute(pc);

      expect(pr.match(createMatchParams('/about'))).to.be.ok;
    });

    it(`should *not* use the cleanURLs of 'about.html' if set to false`, async function () {
      const pc = new PrecacheController();
      pc.addToCacheList([`/about.html`]);

      const pr = new PrecacheRoute(pc, {
        cleanURLs: false,
      });

      expect(pr.match(createMatchParams('/about'))).to.not.be.ok;
    });

    it(`should use a custom urlManipulation function`, async function () {
      const pc = new PrecacheController();
      pc.addToCacheList([`/123.html`]);

      const pr = new PrecacheRoute(pc, {
        urlManipulation: ({url}) => {
          expect(url.pathname).to.equal('/');
          const customURL = new URL(url);
          customURL.pathname = '123.html';
          return [customURL];
        },
      });

      expect(pr.match(createMatchParams('/'))).to.be.ok;
    });

    it(`should return null if there is no match`, async function () {
      const pc = new PrecacheController();
      pc.addToCacheList([`/precached.html`]);

      const pr = new PrecacheRoute(pc);

      expect(pr.match(createMatchParams('/not-precached'))).to.not.be.ok;
    });
  });

  describe('.handler', function () {
    it(`should use the PrecacheController's strategy as the handler`, function () {
      const pc = new PrecacheController();
      const pr = new PrecacheRoute(pc);

      expect(pc.strategy.handle).to.equal(pr.handler.handle);
    });
  });

  describe('.method', function () {
    it(`defaults to GET`, function () {
      const pc = new PrecacheController();
      const pr = new PrecacheRoute(pc);

      expect(pr.method).to.equal('GET');
    });
  });
});

/* global goog, expect */

describe('End to End Test of registerNavigationRoute()', function() {
  // This uses {once: true} to ensure that each load event handler is only called once.
  // It also modifies the iframe.src instead of using fetch(), since you can't use fetch()
  // to make a request with mode === 'navigate'.
  it(`should serve the App Shell content based on the whitelist/blacklist`, function(callback) {
    goog.swUtils.activateSW('../static/sw/navigation-route.js')
      .then((iframe) => {
        iframe.addEventListener('load', () => {
          expect(iframe.contentWindow.document.body.innerText).to.equal('navigation');

          iframe.addEventListener('load', () => {
            expect(iframe.contentWindow.document.body.innerText).not.to.equal('navigation');
            callback();
          }, {once: true});

          iframe.src = iframe.src + '/blacklisted';
        }, {once: true});

        iframe.src = iframe.src + '/navigation';
      });
  });
});

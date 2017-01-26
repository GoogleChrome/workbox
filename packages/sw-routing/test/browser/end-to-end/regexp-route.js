/* global goog, expect */

describe('End to End Test of RegExpRoute', () => {
  it('should work properly when there are multiple routes', () => goog.swUtils.activateSW('end-to-end/sw/regexp-route.js')
    .then(iframe => Promise.all([
      iframe.contentWindow.fetch('/static')
       .then(response => response.text())
       .then(text => expect(text).to.equal('static response')),

      iframe.contentWindow.fetch('/echo/1234')
        .then(response => response.text())
        .then(text => expect(text).to.equal('1234')),

      iframe.contentWindow.fetch('/will-not-match')
        .then(response => expect(response.status).to.equal(404)),
    ]))
  );
});

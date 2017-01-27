describe('End to End Test of RegExpRoute', function() {
  it('should work properly when there are multiple routes', function() {
    return goog.swUtils.activateSW('../static/regexp-route.js')
      .then((iframe) => Promise.all([
        iframe.contentWindow.fetch('/static')
          .then((response) => response.text())
          .then((text) => expect(text).to.equal('static response')),

        iframe.contentWindow.fetch('/echo3/1st/abc/2nd/def/3rd/ghi')
          .then((response) => response.json())
          .then((json) => expect(json).to.eql(['abc', 'def', 'ghi'])),

        iframe.contentWindow.fetch('/will-not-match')
          .then((response) => expect(response.status).to.equal(404)),
      ]));
  });
});

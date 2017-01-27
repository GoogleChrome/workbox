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

describe('End to End Test of ExpressRoute', function() {
  it('should work properly when there are multiple routes', function() {
    return goog.swUtils.activateSW('../static/express-route.js')
      .then((iframe) => Promise.all([
        iframe.contentWindow.fetch('/static')
          .then((response) => response.text())
          .then((text) => expect(text).to.equal('static response')),

        iframe.contentWindow.fetch('/echo3/abc/def/ghi')
          .then((response) => response.json())
          .then((json) => expect(json).to.eql({
            '1st': 'abc',
            '2nd': 'def',
            '3rd': 'ghi',
          })),

        iframe.contentWindow.fetch('/will-not-match')
          .then((response) => expect(response.status).to.equal(404)),
      ]));
  });
});

describe('End to End Test of Route', function() {
  it('should work properly when there are multiple routes, matching different HTTP methods', function() {
    return goog.swUtils.activateSW('../static/route.js')
      .then((iframe) => Promise.all([
        iframe.contentWindow.fetch('/static')
          .then((response) => response.text())
          .then((text) => expect(text).to.equal('static response')),

        iframe.contentWindow.fetch('/method/put', {method: 'PUT'})
          .then((response) => response.text())
          .then((text) => expect(text).to.equal('put response')),

        iframe.contentWindow.fetch('/method/put', {method: 'GET'})
          .then((response) => expect(response.status).to.equal(404)),

        iframe.contentWindow.fetch('/echo3/1st/abc/2nd/def/3rd/ghi')
          .then((response) => response.json())
          .then((json) => expect(json).to.eql(['abc', 'def', 'ghi'])),

        iframe.contentWindow.fetch(new Request('/echobody', {
          method: 'POST', body: 'echo body'}))
          .then((response) => response.text())
          .then((text) => expect(text).to.equal('echo body')),

        iframe.contentWindow.fetch('/will-not-match')
          .then((response) => expect(response.status).to.equal(404)),
      ]));
  });
});

describe('End to End Test of Router', function() {
  it('should work properly with routes, defaultHandler, and catchHandler', function() {
    return goog.swUtils.activateSW('../static/router.js')
      .then((iframe) => Promise.all([
        iframe.contentWindow.fetch('/static')
          .then((response) => response.text())
          .then((text) => expect(text).to.equal('static response')),

        iframe.contentWindow.fetch('/throw-error')
          .then((response) => response.text())
          .then((text) => expect(text).to.equal('catchHandler response')),

        iframe.contentWindow.fetch('/will-not-match')
          .then((response) => response.text())
          .then((text) => expect(text).to.equal('defaultHandler response')),
      ]));
  });
});

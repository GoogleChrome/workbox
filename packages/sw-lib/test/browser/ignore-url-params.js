/* global goog */

describe('Test ignore url params matching', function() {
  it(`should match with correct default params`, function() {
    return goog.swUtils.activateSW('../static/sw/ignore-url-params.js')
    .then((iframe) => {
      let cacheEntry = null;
      return iframe.contentWindow.caches.match('/__echo/date/hello')
      .then((response) => {
        return response.text();
      })
      .then((cE) => {
        // Just make sure we cached something from the test server.
        cE.indexOf('hello').should.not.equal(-1);
        cacheEntry = cE;
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello');
      })
      .then((result) => {
        return result.text();
      })
      .then((response) => {
        response.should.equal(cacheEntry);
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello?utm_=something');
      })
      .then((result) => {
        return result.text();
      })
      .then((response) => {
        response.should.equal(cacheEntry);
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello?utm_=something&should=fail')
        .then(() => {
          throw new Error('Expected this to error');
        }, () => {});
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello?should=fail&utm_=something')
        .then(() => {
          throw new Error('Expected this to error');
        }, () => {});
      });
    });
  });

  it(`should match with custom params`, function() {
    return goog.swUtils.activateSW('../static/sw/ignore-url-params-custom.js')
    .then((iframe) => {
      let cacheEntry = null;
      return iframe.contentWindow.caches.match('/__echo/date/hello')
      .then((response) => {
        return response.text();
      })
      .then((cE) => {
        // Just make sure we cached something from the test server.
        cE.indexOf('hello').should.not.equal(-1);
        cacheEntry = cE;
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello');
      })
      .then((result) => {
        return result.text();
      })
      .then((response) => {
        response.should.equal(cacheEntry);
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello?example=something')
        .then((result) => {
          return result.text();
        })
        .then((response) => {
          response.should.equal(cacheEntry);
        });
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello?somethingtestsomething=something')
        .then((result) => {
          return result.text();
        })
        .then((response) => {
          response.should.equal(cacheEntry);
        });
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello?somethingtestsomething=something&example=testing')
        .then((result) => {
          return result.text();
        })
        .then((response) => {
          response.should.equal(cacheEntry);
        });
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello?somethingtestsomething=something&example=testing&utm_=something')
        .then(() => {
          throw new Error('Expected this to error');
        }, () => {});
      })
      .then(() => {
        return iframe.contentWindow.fetch('/__echo/date/hello?utm_=something')
        .then(() => {
          throw new Error('Expected this to error');
        }, () => {});
      });
    });
  });
});

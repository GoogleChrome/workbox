/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

describe(`Test ignore url params matching`, function() {
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

  it(`should ignore the URL's hash when routing to a precached URL`, async function() {
    const responseBody = 'hello';
    const urlObject = new URL(`/__echo/date/${responseBody}`, location);
    urlObject.hash = 'should-be-ignored';

    const iframe = await goog.swUtils.activateSW('../static/sw/ignore-url-params.js');
    const fetchResponse = await iframe.contentWindow.fetch(urlObject.href);
    const fetchResponseBody = await fetchResponse.text();

    expect(fetchResponseBody.startsWith(responseBody)).to.be.true;
  });
});

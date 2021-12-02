/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const MODULE_PATH =
  '../../../../../packages/workbox-cli/build/lib/questions/ask-questions';

describe(`[workbox-cli] lib/questions/ask-questions.js`, function () {
  it(`should ask all the expected questions in the correct order, and return the expected result in generateSW mode`, async function () {
    // Using a stub that returns an increasing value for each call makes it
    // easy to verify that all the stubs are called in the expected order,
    // and to verify that the stub's responses are used to create the overall
    // response in the expected fashion.
    let count = 0;
    const stub = sinon.stub();

    const {askQuestions} = proxyquire(MODULE_PATH, {
      './ask-root-of-web-app': {
        askRootOfWebApp: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-extensions-to-cache': {
        askExtensionsToCache: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-sw-dest': {
        askSWDest: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-config-location': {
        askConfigLocation: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-start_url-query-params': {
        askQueryParametersInStartUrl: stub.callsFake(() =>
          Promise.resolve(count++),
        ),
      },
    });

    const answer = await askQuestions();
    expect(answer).to.eql({
      config: {
        globDirectory: 0,
        globPatterns: 1,
        swDest: 2,
        ignoreURLParametersMatching: 4,
      },
      configLocation: 3,
    });
    expect(stub.callCount).to.eql(5);
  });

  it(`should ask all the expected questions in the correct order, and return the expected result in injectManifest mode`, async function () {
    // Using a stub that returns an increasing value for each call makes it
    // easy to verify that all the stubs are called in the expected order,
    // and to verify that the stub's responses are used to create the overall
    // response in the expected fashion.
    let count = 0;
    const stub = sinon.stub();

    const {askQuestions} = proxyquire(MODULE_PATH, {
      './ask-root-of-web-app': {
        askRootOfWebApp: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-extensions-to-cache': {
        askExtensionsToCache: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-sw-src': {
        askSWSrc: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-sw-dest': {
        askSWDest: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-config-location': {
        askConfigLocation: stub.callsFake(() => Promise.resolve(count++)),
      },
      './ask-start_url-query-params': {
        askQueryParametersInStartUrl: stub.callsFake(() =>
          Promise.resolve(count++),
        ),
      },
    });

    const answer = await askQuestions({injectManifest: true});
    expect(answer).to.eql({
      config: {
        globDirectory: 0,
        globPatterns: 1,
        swSrc: 2,
        swDest: 3,
      },
      configLocation: 4,
    });
    expect(stub.callCount).to.eql(5);
  });
});

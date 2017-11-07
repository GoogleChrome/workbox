const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const MODULE_PATH = '../../../../../packages/workbox-cli/src/lib/questions/ask-questions';

describe(`[workbox-cli] lib/questions/ask-questions.js`, function() {
  it(`should ask all the expected questions in the correct order, and return the expected result `, async function() {
    // Using a stub that returns an increasing value for each call makes it
    // easy to verify that all the stubs are called in the expected order,
    // and to verify that the stub's responses are used to create the overall
    // response in the expected fashion.
    let count = 0;
    const stub = sinon.stub().callsFake(() => Promise.resolve(count++));

    const askQuestions = proxyquire(MODULE_PATH, {
      './ask-root-of-web-app': stub,
      './ask-extensions-to-cache': stub,
      './ask-sw-dest': stub,
      './ask-config-location': stub,
    });

    const answer = await askQuestions();
    expect(answer).to.eql({
      config: {globDirectory: 0, globPatterns: 1, swDest: 2},
      configLocation: 3,
    });
    expect(stub.callCount).to.eql(4);
  });
});


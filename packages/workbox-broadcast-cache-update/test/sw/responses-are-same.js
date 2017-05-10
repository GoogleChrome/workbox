importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/workbox-broadcast-cache-update'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the responsesAreSame function', function() {
  const firstHeaderName = 'x-first-header';
  const secondHeaderName = 'x-second-header';
  const headersToCheck = [firstHeaderName, secondHeaderName];

  it(`should throw when responsesAreSame() is called without any parameters`, function() {
    let thrownError = null;
    try {
      goog.broadcastCacheUpdate.responsesAreSame();
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('responses-are-same-parameters-required');
  });

  it(`should return true when all the headers match`, function() {
    const first = new Response('', {headers: {
      [firstHeaderName]: 'same', [secondHeaderName]: 'same'}});
    const second = new Response('', {headers: {
      [firstHeaderName]: 'same', [secondHeaderName]: 'same'}});
    expect(goog.broadcastCacheUpdate.responsesAreSame({
      first, second, headersToCheck})).to.be.true;
  });

  it(`should return true when only a subset of headers exist, but the existing ones match`, function() {
    const first = new Response('', {headers: {
      [firstHeaderName]: 'same'}});
    const second = new Response('', {headers: {
      [firstHeaderName]: 'same'}});
    expect(goog.broadcastCacheUpdate.responsesAreSame({
      first, second, headersToCheck})).to.be.true;
  });

  it(`should return true when no headers exist`, function() {
    const first = new Response('');
    const second = new Response('');
    expect(goog.broadcastCacheUpdate.responsesAreSame({
      first, second, headersToCheck})).to.be.true;
  });

  it(`should return false when one header matches and the other doesn't`, function() {
    const first = new Response('', {
      headers: {[firstHeaderName]: 'same', [secondHeaderName]: 'same'}});
    const second = new Response('', {
      headers: {[firstHeaderName]: 'same', [secondHeaderName]: 'different'}});
    expect(goog.broadcastCacheUpdate.responsesAreSame({
      first, second, headersToCheck})).to.be.false;
  });

  it(`should return false when none of the headers match`, function() {
    const first = new Response('', {headers: {
      [firstHeaderName]: 'same', [secondHeaderName]: 'same'}});
    const second = new Response('', {headers: {
      [firstHeaderName]: 'different', [secondHeaderName]: 'different'}});
    expect(goog.broadcastCacheUpdate.responsesAreSame({
      first, second, headersToCheck})).to.be.false;
  });
});

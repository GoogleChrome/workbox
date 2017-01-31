importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-broadcast-cache-update/build/sw-broadcast-cache-update.min.js'
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
    expect(() => goog.broadcastCacheUpdate.responsesAreSame()).to.throw();
  });

  it(`should return true when all the headers match`, function() {
    const first = new Response('', {headers: {
      [firstHeaderName]: 'same', [secondHeaderName]: 'same'}});
    const second = new Response('', {headers: {
      [firstHeaderName]: 'same', [secondHeaderName]: 'same'}});
    expect(goog.broadcastCacheUpdate.responsesAreSame({
      first, second, headersToCheck})).to.be.true;
  });

  it(`should return true when one header matches and the other is missing`, function() {
    const first = new Response('', {headers: {
      [firstHeaderName]: 'same'}});
    const second = new Response('', {headers: {
      [firstHeaderName]: 'same'}});
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

importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-sw');

describe(`Test Library Surface`, function() {
  it(`should be accessible via WorkboxSW`, function() {
    expect(WorkboxSW).to.exist;
  });

  it(`should be able to construct WorkboxSW without error`, function() {
    new WorkboxSW();
  });
});

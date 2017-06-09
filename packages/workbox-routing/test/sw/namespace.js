importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-routing');

const exportedClasses = [
  'ExpressRoute',
  'NavigationRoute',
  'RegExpRoute',
  'Route',
  'Router',
];

describe('Test Library Surface', function() {
  it('should be accessible via workbox.routing', function() {
    expect(workbox.routing).to.exist;
  });

  exportedClasses.forEach((exportedClass) => {
    it(`should expose ${exportedClass} via workbox.routing`, function() {
      expect(workbox.routing[exportedClass]).to.exist;
    });
  });
});

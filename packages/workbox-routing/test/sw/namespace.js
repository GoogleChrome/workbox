importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/workbox-routing'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

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

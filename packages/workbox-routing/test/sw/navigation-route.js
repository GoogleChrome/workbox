importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-routing');

describe('Test of the NavigationRoute class', function() {
  const path = '/test/path';
  const whitelist = [new RegExp(path)];
  const blacklist = [new RegExp(path)];
  const handler = {handle: () => {}};
  const event = {request: {mode: 'navigate'}};

  const invalidHandler = {};
  const invalidBlacklist = 'invalid';
  const invalidWhitelist = 'invalid';
  const invalidEvent = {request: {mode: 'cors'}};

  it(`should throw when NavigationRoute() is called without any parameters`, function() {
    let thrownError = null;
    try {
      new workbox.routing.NavigationRoute();
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should throw when NavigationRoute() is called without a valid whitelist`, function() {
    let thrownError = null;
    try {
      new workbox.routing.NavigationRoute({whitelist: invalidWhitelist});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should throw when NavigationRoute() is called without a valid handler`, function() {
    let thrownError = null;
    try {
      new workbox.routing.NavigationRoute({whitelist});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');

    try {
      new workbox.routing.NavigationRoute({whitelist, handler: invalidHandler});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should throw when NavigationRoute() is called with an invalid blacklist`, function() {
    let thrownError = null;
    try {
      new workbox.routing.NavigationRoute({whitelist, handler, blacklist: invalidBlacklist});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should not throw when NavigationRoute() is called with valid whitelist and handler parameters`, function() {
    expect(() => new workbox.routing.NavigationRoute({handler, whitelist})).not.to.throw();
  });

  it(`should match navigation requests for URLs that are in the whitelist`, function() {
    const url = new URL(path, location);
    const route = new workbox.routing.NavigationRoute({handler, whitelist});
    expect(route.match({event, url})).to.be.ok;
  });

  it(`should match navigation requests for URLs whose search portion is in the whitelist`, function() {
    const url = new URL('/willnotmatch', location);
    const urlSearchValue = 'willmatch';
    url.search = urlSearchValue;
    const route = new workbox.routing.NavigationRoute({handler, whitelist: [
      new RegExp(`${urlSearchValue}$`),
    ]});
    expect(route.match({event, url})).to.be.ok;
  });

  it(`should not match navigation requests for URLs that are in both the whitelist and the blacklist`, function() {
    const url = new URL(path, location);
    const route = new workbox.routing.NavigationRoute({handler, whitelist, blacklist});
    expect(route.match({event, url})).to.not.be.ok;
  });

  it(`should not match navigation requests for URLs that are not in the whitelist`, function() {
    const url = new URL('/does/not/match', location);
    const route = new workbox.routing.NavigationRoute({handler, whitelist});
    expect(route.match({event, url})).to.not.be.ok;
  });

  it(`should not match non-navigation requests for URLs that are in the whitelist`, function() {
    const url = new URL(path, location);
    const route = new workbox.routing.NavigationRoute({handler, whitelist});
    expect(route.match({event: invalidEvent, url})).to.not.be.ok;
  });
});

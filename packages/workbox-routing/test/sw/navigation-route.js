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

/* eslint-env mocha, browser */

import NavigationRoute from '../../src/lib/navigation-route.js';

describe(`Test of the NavigationRoute class`, function() {
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
    expect(() => {
      new NavigationRoute();
    }).to.throw().with.property('name', 'assertion-failed');
  });

  it(`should throw when NavigationRoute() is called without a valid whitelist`, function() {
    expect(() => {
      new NavigationRoute({whitelist: invalidWhitelist});
    }).to.throw().with.property('name', 'assertion-failed');
  });

  it(`should throw when NavigationRoute() is called without a valid handler`, function() {
    expect(() => {
      new NavigationRoute({whitelist});
    }).to.throw().with.property('name', 'assertion-failed');
    expect(() => {
      new NavigationRoute({whitelist, handler: invalidHandler});
    }).to.throw().with.property('name', 'assertion-failed');
  });

  it(`should throw when NavigationRoute() is called with an invalid blacklist`, function() {
    expect(() => {
      new NavigationRoute({whitelist, handler, blacklist: invalidBlacklist});
    }).to.throw().with.property('name', 'assertion-failed');
  });

  it(`should not throw when NavigationRoute() is called with valid whitelist and handler parameters`, function() {
    expect(() => new NavigationRoute({handler, whitelist})).not.to.throw();
  });

  it(`should match navigation requests for URLs that are in the whitelist`, function() {
    const url = new URL(path, location);
    const route = new NavigationRoute({handler, whitelist});
    expect(route.match({event, url})).to.be.ok;
  });

  it(`should match navigation requests for URLs whose search portion is in the whitelist`, function() {
    const url = new URL('/willnotmatch', location);
    const urlSearchValue = 'willmatch';
    url.search = urlSearchValue;
    const route = new NavigationRoute({handler, whitelist: [
      new RegExp(`${urlSearchValue}$`),
    ]});
    expect(route.match({event, url})).to.be.ok;
  });

  it(`should not match navigation requests for URLs that are in both the whitelist and the blacklist`, function() {
    const url = new URL(path, location);
    const route = new NavigationRoute({handler, whitelist, blacklist});
    expect(route.match({event, url})).to.not.be.ok;
  });

  it(`should not match navigation requests for URLs that are not in the whitelist`, function() {
    const url = new URL('/does/not/match', location);
    const route = new NavigationRoute({handler, whitelist});
    expect(route.match({event, url})).to.not.be.ok;
  });

  it(`should not match non-navigation requests for URLs that are in the whitelist`, function() {
    const url = new URL(path, location);
    const route = new NavigationRoute({handler, whitelist});
    expect(route.match({event: invalidEvent, url})).to.not.be.ok;
  });
});

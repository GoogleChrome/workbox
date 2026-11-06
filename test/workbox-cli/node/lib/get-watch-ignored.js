/*
  Copyright 2026 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');
const upath = require('upath');

const {
  getWatchIgnored,
} = require('../../../../packages/workbox-cli/build/lib/get-watch-ignored');

describe(`[workbox-cli] lib/get-watch-ignored.js`, function () {
  const ROOT = upath.resolve('/project/dist');
  const file = {isFile: () => true};
  const directory = {isFile: () => false};

  const ignored = getWatchIgnored(
    ROOT,
    ['**/*.{js,css}'],
    ['**/node_modules/**/*', '**/*.min.js'],
  );

  it(`should not ignore the root directory`, function () {
    expect(ignored(ROOT, directory)).to.be.false;
  });

  it(`should not ignore a file matching globPatterns`, function () {
    expect(ignored(upath.join(ROOT, 'a/b.js'), file)).to.be.false;
    expect(ignored(upath.join(ROOT, 'c.css'), file)).to.be.false;
  });

  it(`should ignore a file that doesn't match globPatterns`, function () {
    expect(ignored(upath.join(ROOT, 'a/b.txt'), file)).to.be.true;
  });

  it(`should ignore a file matching globIgnores`, function () {
    expect(ignored(upath.join(ROOT, 'a/b.min.js'), file)).to.be.true;
    expect(ignored(upath.join(ROOT, 'node_modules/a/b.js'), file)).to.be.true;
  });

  it(`should ignore a directory ruled out by globIgnores`, function () {
    expect(ignored(upath.join(ROOT, 'node_modules'), directory)).to.be.true;
    expect(ignored(upath.join(ROOT, 'a/node_modules'), directory)).to.be.true;
  });

  it(`should not ignore other directories, even if they don't match globPatterns`, function () {
    expect(ignored(upath.join(ROOT, 'a'), directory)).to.be.false;
  });

  it(`should not ignore a path whose stats aren't known yet, unless it matches globIgnores`, function () {
    expect(ignored(upath.join(ROOT, 'a/b.txt'))).to.be.false;
    expect(ignored(upath.join(ROOT, 'node_modules'))).to.be.true;
  });

  it(`should resolve relative paths against the root directory`, function () {
    expect(ignored('a/b.js', file)).to.be.false;
    expect(ignored('a/b.txt', file)).to.be.true;
  });
});

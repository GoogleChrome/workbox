/*
  Copyright 2026 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');

const {
  stripComments,
} = require('../../../../packages/workbox-build/build/lib/strip-comments');

describe(`[workbox-build] lib/strip-comments.js`, function () {
  it(`should strip comments from each kind of function`, function () {
    for (const [source, expected] of [
      ['function () { // a\n}', 'function () { \n}'],
      ['function () {/* a */}', 'function () { }'],
      ['(a) => { // b\n}', '(a) => { \n}'],
      ['a => /* b */ a', 'a =>   a'],
      ['async function () {/* a */}', 'async function () { }'],
      ['foo() {/* a */}', 'foo() { }'],
      ['async foo() {/* a */}', 'async foo() { }'],
      ['*foo() {/* a */}', '*foo() { }'],
      ['get foo() {/* a */}', 'get foo() { }'],
      ['["foo"]() {/* a */}', '["foo"]() { }'],
      ['class A {/* a */}', 'class A { }'],
    ]) {
      expect(stripComments(source)).to.eql(expected);
    }
  });

  it(`should leave comment-like strings, templates and regular expressions alone`, function () {
    for (const source of [
      'function () { return "https://example.com/*a*/"; }',
      'function () { return `// a`; }',
      'function () { return /\\/\\*a\\*\\//; }',
    ]) {
      expect(stripComments(source)).to.eql(source);
    }
  });

  it(`should keep the tokens around a block comment separate`, function () {
    expect(stripComments('function () { return/* a */1; }')).to.eql(
      'function () { return 1; }',
    );
  });

  it(`should keep the line break from a multi-line block comment`, function () {
    expect(stripComments('function () { return/* a\n */1; }')).to.eql(
      'function () { return\n1; }',
    );
  });

  it(`should return source that can't be parsed unchanged`, function () {
    const source = 'function max() { [native code] }';
    expect(stripComments(source)).to.eql(source);
  });
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const validateOptions = require('../../../../packages/workbox-build/src/lib/validate-options');

describe(`[workbox-build] entry-points/options/validate.js`, function() {
  const testOptions = {
    ignored: 'test',
  };

  it(`should throw when the call to schema.validate() returns an error`, function() {
    const error = 'dummy error';
    const schema = {
      validate: (options) => {
        expect(options).to.eql(testOptions);
        return {error};
      },
    };

    expect(() => validateOptions(testOptions, schema)).to.throw(error);
  });

  it(`should pass through the value when the call to schema.validate() doesn't return an error`, function() {
    const schema = {
      validate: (options) => {
        expect(options).to.eql(testOptions);
        return {value: options};
      },
    };

    const value = validateOptions(testOptions, schema);
    expect(value).to.eql(testOptions);
  });
});

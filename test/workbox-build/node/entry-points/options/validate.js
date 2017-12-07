const expect = require('chai').expect;

const baseSchema = require('../../../../../packages/workbox-build/src/entry-points/options/base-schema');
const validate = require('../../../../../packages/workbox-build/src/entry-points/options/validate');

describe(`[workbox-build] entry-points/options/validate.js`, function() {
  const badInputs = [
    [],
    '',
    null,
    0,
    {invalidKey: true},
  ];

  for (const badInput of badInputs) {
    it(`should throw a ValidationError when passed bad input: ${JSON.stringify(badInput)}`, function() {
      expect(
        () => validate(badInput, baseSchema)
      ).to.throw().with.property('name', 'ValidationError');
    });
  }

  it(`should return the default options when passed empty input`, function() {
    const options = validate({}, baseSchema);

    expect(options).to.eql({
      globFollow: true,
      globIgnores: ['node_modules/**/*'],
      globPatterns: ['**/*.{js,css,html}'],
      globStrict: true,
      maximumFileSizeToCacheInBytes: 2097152,
    });
  });

  it(`should return the default options, honoring any overrides`, function() {
    const maximumFileSizeToCacheInBytes = 1;
    const options = validate({maximumFileSizeToCacheInBytes}, baseSchema);

    expect(options).to.eql({
      globFollow: true,
      globIgnores: ['node_modules/**/*'],
      globPatterns: ['**/*.{js,css,html}'],
      globStrict: true,
      maximumFileSizeToCacheInBytes,
    });
  });

  it(`should return the default options, honoring any additional options`, function() {
    const dontCacheBustUrlsMatching = /test/;
    const options = validate({dontCacheBustUrlsMatching}, baseSchema);

    expect(options).to.eql({
      dontCacheBustUrlsMatching,
      globFollow: true,
      globIgnores: ['node_modules/**/*'],
      globPatterns: ['**/*.{js,css,html}'],
      globStrict: true,
      maximumFileSizeToCacheInBytes: 2097152,
    });
  });
});

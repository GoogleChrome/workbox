/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * @callback VariantCallback
 * @param {Object} variant
 */
/**
 * This is a helper function that will auto-generate mocha unit tests
 * for various inputs.
 *
 * @param {string} itTitle This is the title that will be passed to the it()
 * function. The variant will be added to the end of this title to help
 * idenfity the failing test.
 * @param {Array<Object>} variants This should be all the variations of the
 * test you wish to generate.
 * @param {VariantCallback} func This is the function that will be called, with a
 * variant as the only argument. This function should perform the desired test.
 */
const generateVariantTests = (itTitle, variants, func) => {
  variants.forEach((variant) => {
    // We are using function() {} here and NOT ARROW FUNCTIONS
    // to work with Mocha's binding for tests.
    it(`${itTitle}. Variant: '${JSON.stringify(variant)}'`, function () {
      // Use .call to get the correct `this` binding needed by mocha.
      // eslint-disable-next-line no-invalid-this
      return func.call(this, variant);
    });
  });
};

if (module.exports) {
  module.exports = generateVariantTests;
} else {
  self.__workbox.generateVariantTests = generateVariantTests;
}

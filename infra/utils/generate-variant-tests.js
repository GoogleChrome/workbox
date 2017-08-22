/**
 * This is a helper function that will auto-generate mocha unit tests
 * for various inputs.
 *
 * @param {String} itTitle This is the title that will be passed to the it()
 * function. The variant will be added to the end of this title to help
 * idenfity the failing test.
 * @param {Array<Objects>} variants This should be all the variations of the
 * test you wish to generate.
 * @param {function} func This is the function that will be called, with a
 * variant as the only argument. This function should perform the desired test.
 */
const generateVariantTests = (itTitle, variants, func) => {
  variants.forEach((variant) => {
    // We are using function() {} here and NOT ARROW FUNCTIONS
    // to work with Mocha's binding for tests.
    it(`${itTitle}. Variant: '${JSON.stringify(variant)}'`,
      function() {
        return func(variant);
      }
    );
  });
};

if (module.exports) {
  module.exports = generateVariantTests;
} else {
  self.__workbox.generateVariantTests = generateVariantTests;
}

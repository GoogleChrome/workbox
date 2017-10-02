const fakeRunAndCompare = require('./validator/fake-run-and-compare');
const testInBrowser = require('./validator/test-in-browser');

const performTest = (generateSWCb, {exampleProject, swDest, fileExtensions, baseTestUrl, modifyUrlPrefix}) => {
  return fakeRunAndCompare(generateSWCb, swDest, exampleProject, fileExtensions, modifyUrlPrefix)
  .then((manifest) => {
    return testInBrowser(baseTestUrl, manifest, swDest, exampleProject, modifyUrlPrefix);
  });
};

module.exports = {
  performTest: performTest,
};

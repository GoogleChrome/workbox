const fakeRunAndCompare = require('./validator/fake-run-and-compare');
const testInBrowser = require('./validator/test-in-browser');
/* eslint-disable require-jsdoc */

const performTest = (generateSWCb, {exampleProject, swDest, fileExtensions, baseTestUrl, modifyUrlPrefix}) => {
  console.log(`Validating a new project, SWDest is: '${swDest}'`);
  return fakeRunAndCompare(generateSWCb, swDest, exampleProject, fileExtensions, modifyUrlPrefix)
  .then((manifest) => {
    return testInBrowser(baseTestUrl, manifest, swDest, exampleProject, modifyUrlPrefix);
  });
};


module.exports = {
  performTest: performTest,
};

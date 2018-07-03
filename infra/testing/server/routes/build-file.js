const path = require('path');

const constants = require('../../../../gulp-tasks/utils/constants');

const match = '/__WORKBOX/buildFile/:moduleInfo';

async function handler(req, res) {
  const {moduleInfo} = req.params;
  const [moduleName, buildType, extension] = moduleInfo.split('.', 3);

  const packagePath = `../../../../packages/${moduleName}`;
  const {main} = require(`${packagePath}/package.json`);

  const buildPath = path.dirname(path.join(packagePath, main));
  let fileName = path.basename(main);

  if (buildType) {
    fileName = fileName.replace('.prod.', `.${buildType}.`);
  } else if (process.env.NODE_ENV === constants.BUILD_TYPES.dev) {
    fileName = fileName.replace('.prod.', '.dev.');
  }

  if (extension) {
    fileName = fileName.replace(/\.js$/, `.${extension}`);
  }

  const filePath = path.resolve(__dirname, buildPath, fileName);
  res.sendFile(filePath);
}

module.exports = {
  handler,
  match,
};

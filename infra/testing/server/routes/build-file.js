const path = require('path');
const send = require('koa-send');

const constants = require('../../../../gulp-tasks/utils/constants');

const match = '/__WORKBOX/buildFile/:moduleInfo';

async function handler(ctx) {
  const {moduleInfo} = ctx.params;
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

  const root = path.resolve(__dirname, buildPath);
  await send(ctx, fileName, {root});
}

module.exports = {
  handler,
  match,
};

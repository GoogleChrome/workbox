module.exports = (pkgName) => {
  const pkgJson = require(`../../packages/${pkgName}/package.json`);
  const details = ['workbox', pkgName, pkgJson.version];
  return `function v(){v._version='${details.join(':')}'};v();`;
};

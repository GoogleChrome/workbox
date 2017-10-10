const lernaPkg = require('../../lerna.json');

module.exports = (pkgName) => {
  const pkgJson = require(`../../packages/${pkgName}/package.json`);
  const details = ['workbox', lernaPkg.version, pkgName, pkgJson.version];
  return `(function(){this._version='${details.join(':')}'})();`;
};

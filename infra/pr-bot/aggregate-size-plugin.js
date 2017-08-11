const glob = require('glob');
const path = require('path');
const PluginInterface = require('pr-bot').PluginInterface;

class AggregateSizePlugin extends PluginInterface {
  constructor() {
    super(`Workbox Aggregate Size Plugin`);
  }

  run(beforePath, afterPath) {
    console.log(arguments);
    const packagesToAggregate = [
      `workbox-loading`,
      `workbox-core`,
      `workbox-precaching`,
      `workbox-routing`,
      `workbox-strategies`,
      `workbox-cacheable-response`,
      `workbox-cache-expiration`,
    ];
    const files = glob.sync(path.posix.join(
      afterPath, 'packages', `(${packagesToAggregate.join(',')})`,
      'build', 'browser-bundles', '*.production.js',
    ));
    console.log(files);
    return Promise.resolve({
      prettyLog: `TODO: Log details to console`,
      markdownLog: `TODO: return details in markdown`,
    });
  }
}

module.exports = AggregateSizePlugin;

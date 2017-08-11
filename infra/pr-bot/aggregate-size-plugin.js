const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const PluginInterface = require('pr-bot').PluginInterface;

// 10 KB max size
const MAX_SIZE = 10 * 1000;

class AggregateSizePlugin extends PluginInterface {
  constructor() {
    super(`Workbox Aggregate Size Plugin`);
  }

  run({beforePath, afterPath} = {}) {
    const packagesToAggregate = [
      `workbox-loading`,
      `workbox-core`,
      `workbox-precaching`,
      `workbox-routing`,
      `workbox-strategies`,
      `workbox-cacheable-response`,
      `workbox-cache-expiration`,
    ];
    const globPattern = path.posix.join(
      afterPath, 'packages', `{${packagesToAggregate.join(',')}}`,
      'build', 'browser-bundles', '*.production.js',
    );
    const files = glob.sync(globPattern);
    let totalSize = 0;
    files.forEach((filePath) => {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });

    const percentValue = (totalSize / MAX_SIZE) * 100;
    const percentString = parseFloat(percentValue).toFixed(0);

    let totalSizeString = totalSize.toString();
    let unitString = 'B';
    if (totalSize > 1000) {
      unitString = 'KB';
      totalSizeString = parseFloat(totalSize).toFixed(2);
    }

    let markdownWarning = ``;
    if (percentValue >= 90) {
      const markdownMoji = percentValue >= 95 ? '☠️' : '⚠️';
      markdownWarning = oneLine`
      <h3 align="center">${markdownMoji} WARNING ${markdownMoji}</h3>
      <p align="center">
        We are using <strong>${percentValue}%</strong> of our max size budget.
      </p>
      `;
    }

    const failPR = totalSize >= MAX_SIZE;

    const markdownLog = `${markdownWarning}\n\n`+
      `**Total Size**:                   ${totalSizeString} ${unitString}\n` +
      `**Percentage of Size Remaining:** ${percentString}%`;
    const prettyLog =
      `Total Size:                   ${totalSizeString} ${unitString}\n` +
      `Percentage of Size Remaining: ${percentString}%`;
    return Promise.resolve({
      prettyLog,
      markdownLog,
      failPR,
    });
  }
}

module.exports = AggregateSizePlugin;

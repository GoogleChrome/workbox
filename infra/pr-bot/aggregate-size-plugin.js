/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {oneLine} = require('common-tags');
const {PluginInterface} = require('pr-bot');
const bytes = require('bytes');
const fs = require('fs-extra');
const gzipSize = require('gzip-size');
const path = require('path');

// 15kb max size, gzip'ed.
const MAX_SIZE_GZIP = 15 * 1024;

class AggregateSizePlugin extends PluginInterface {
  constructor() {
    super(`Workbox Aggregate Size Plugin`);
  }

  async run({afterPath} = {}) {
    const packagesToAggregate = [
      `workbox-cacheable-response`,
      `workbox-core`,
      `workbox-expiration`,
      `workbox-precaching`,
      `workbox-routing`,
      `workbox-strategies`,
      `workbox-sw`,
    ];

    const absoluteAfterPath = path.resolve(afterPath);
    const files = packagesToAggregate.map((pkgName) => {
      const prefix = `${absoluteAfterPath}/packages/${pkgName}/`;
      const pkgJson = require(`${prefix}package.json`);
      const posixPath = prefix + pkgJson.main;
      return posixPath.split('/').join(path.sep);
    });

    let totalSize = 0;
    let totalGzipSize = 0;

    for (const filePath of files) {
      const fileContents = await fs.readFile(filePath);
      const stat = await fs.stat(filePath);
      totalSize += stat.size;
      totalGzipSize += await gzipSize(fileContents);
    }

    const percentValue = (totalGzipSize / MAX_SIZE_GZIP) * 100;
    const percentString = parseFloat(percentValue).toFixed(0);

    const totalSizeString = bytes(totalSize);
    const totalGzipString = bytes(totalGzipSize);

    let markdownWarning = ``;
    if (percentValue >= 90) {
      const markdownMoji = percentValue >= 95 ? '☠️' : '⚠️';
      markdownWarning = oneLine`
      <h3 align="center">${markdownMoji} WARNING ${markdownMoji}</h3>
      <p align="center">
        We are using <strong>${percentString}%</strong>
        of our max budget for gzip'ed bundle size.
      </p>`;
    }

    const failPR = Boolean(percentValue > 100);

    const prettyLog =
      `**${totalGzipString}** gzip'ed ` +
      `(**${percentString}%** of limit)\n` +
      `**${totalSizeString}** uncompressed`;

    const markdownLog = `${markdownWarning}\n\n${prettyLog}`;

    return {
      failPR, // Fail the PR if we have exceeded the limit.
      markdownLog,
      prettyLog,
    };
  }
}

module.exports = AggregateSizePlugin;

/*
  Copyright 2026 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type {Stats} from 'fs';
import {minimatch} from 'minimatch';
import upath from 'upath';

/**
 * chokidar no longer accepts glob patterns, so this builds the function that
 * decides which of the paths under the watched directory to ignore.
 *
 * @param {string} rootDirectory The directory being watched.
 * @param {Array<string>} globPatterns The patterns for files to watch.
 * @param {Array<string>} globIgnores The patterns for paths to ignore.
 * @return {Function} A function suitable for chokidar's `ignored` option.
 *
 * @private
 */
export function getWatchIgnored(
  rootDirectory: string,
  globPatterns: Array<string>,
  globIgnores: Array<string>,
): (path: string, stats?: Stats) => boolean {
  // A pattern like **/node_modules/**/* also rules out the directory itself,
  // which avoids walking it.
  const ignoredDirectories = globIgnores
    .filter((pattern) => /\/\*\*(\/\*)?$/.test(pattern))
    .map((pattern) => pattern.replace(/\/\*\*(\/\*)?$/, ''));

  return (path, stats) => {
    const relativePath = upath.relative(
      rootDirectory,
      upath.resolve(rootDirectory, path),
    );
    if (!relativePath) {
      return false;
    }

    const matches = (pattern: string) => minimatch(relativePath, pattern);
    if (globIgnores.some(matches) || ignoredDirectories.some(matches)) {
      return true;
    }

    // Directories have to be walked to find the files in them. The first call
    // for a path may not include stats, and a later one will.
    return Boolean(stats?.isFile()) && !globPatterns.some(matches);
  };
}

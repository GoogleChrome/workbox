/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import path from 'path';
import glob from 'glob';
import {getPackages} from '../../../gulp-tasks/utils/get-packages';


const deprecatedModules = {
  'workbox-strategies': [
    'cacheFirst',
    'cacheOnly',
    'networkFirst',
    'networkOnly',
    'staleWhileRevalidate',
  ],
};

describe(`[all] Window and SW packages`, function() {
  // Reading files can be slow.
  this.timeout(5 * 1000);

  const windowAndBrowserPackages = [
    ...getPackages({type: 'browser'}),
    ...getPackages({type: 'window'}),
  ];

  it(`should have top level files for every export in index.mjs (and vise-versa)`, async function() {
    for (const pkg of windowAndBrowserPackages) {
      const packagePath = path.join(__dirname, '..', '..', '..', 'packages', pkg.name);
      const indexFile = path.join(packagePath, 'index.mjs');
      const moduleExports = await import(indexFile);

      const publicFiles = glob.sync('*.mjs', {
        ignore: ['index.mjs', '_version.mjs', '_types.mjs'],
        cwd: packagePath,
      });

      // Ensure there's a public export for every top-level file in the package.
      for (const publicFile of publicFiles) {
        const expectedExportName = path.basename(publicFile, '.mjs');

        if (!(expectedExportName in moduleExports)) {
          throw new Error(`Unable to find export '${expectedExportName}' in ${indexFile}`);
        }
      }

      // Ensure there's a top-level file for every non-deprecated export in index.mjs
      for (const moduleExport of Object.keys(moduleExports)) {
        const exportedFilename = `${moduleExport}.mjs`;

        // Deprecated exports don't need a corresponding file.
        if (deprecatedModules[pkg.name] &&
            deprecatedModules[pkg.name].includes(moduleExport)) {
          continue;
        }

        if (!publicFiles.includes(exportedFilename)) {
          throw new Error(`Unable to find file '${exportedFilename}' in ${pkg.name} root`);
        }
      }
    }
  });
});

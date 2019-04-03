/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const acorn = require('acorn');
const {expect} = require('chai');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const {getPackages} = require('../../../gulp-tasks/utils/get-packages');


const deprecatedPackageExports = {
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

  it(`should have top a level module for every export in index.mjs (and vise-versa)`, async function() {
    for (const pkg of windowAndBrowserPackages) {
      const packagePath = path.join(__dirname, '..', '..', '..', 'packages', pkg.name);
      const indexFile = path.join(packagePath, 'index.mjs');
      const indexContents = await fs.readFile(indexFile, 'utf-8');

      // Use the acorn parser to generate a list of named exports.
      const namedExports = [];
      const indexAST = acorn.parse(indexContents, {
        ecmaVersion: 6,
        sourceType: 'module',
      });
      for (const node of indexAST.body) {
        if (node.type === 'ExportDefaultDeclaration"') {
          throw new Error(`'index.mjs' files cannot contain default exports`);
        }
        if (node.type === 'ExportNamedDeclaration') {
          if (node.specifiers.length === 0) {
            throw new Error(`'index.mjs' files may only contain a single, named-export block`);
          }
          for (const specifier of node.specifiers) {
            namedExports.push(specifier.exported.name);
          }
        }
      }

      // Inspect the package directory to get a list of top-level, public
      // module basenames.
      const topLevelFiles = glob.sync('*.mjs', {
        ignore: ['index.mjs', '_types.mjs', '_version.mjs'],
        cwd: packagePath,
      }).map((file) => path.basename(file, '.mjs'));

      const deprecatedExports = deprecatedPackageExports[pkg.name] || [];

      // Assert there's a 1-to-1 mapping between exports and top-level files.
      expect(namedExports.sort())
          .to.deep.equal(topLevelFiles.concat(deprecatedExports).sort());
    }
  });
});

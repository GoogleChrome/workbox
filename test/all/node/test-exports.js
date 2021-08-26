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

describe(`[all] Window and SW packages`, function () {
  // Reading files can be slow.
  this.timeout(5 * 1000);

  const windowAndSWPackages = [
    ...getPackages({type: 'sw'}),
    ...getPackages({type: 'window'}),
  ];

  it(`should have top a level module for every export in index.mjs (and vise-versa)`, async function () {
    for (const pkg of windowAndSWPackages) {
      const packagePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'packages',
        pkg.name,
      );

      // TODO(philipwalton): remove this once all packages are converted to
      // typescript or typescript adds `.mjs` support.
      const ext = 'types' in pkg ? 'js' : 'mjs';

      const indexFile = path.join(packagePath, `index.${ext}`);
      const indexContents = await fs.readFile(indexFile, 'utf-8');

      // Use the acorn parser to generate a list of named exports.
      const namedExports = [];
      const indexAST = acorn.parse(indexContents, {
        ecmaVersion: 6,
        sourceType: 'module',
      });
      for (const node of indexAST.body) {
        if (node.type === 'ExportDefaultDeclaration') {
          throw new Error(
            `'index.${ext}' files cannot contain default exports`,
          );
        }
        if (node.type === 'ExportNamedDeclaration') {
          for (const specifier of node.specifiers) {
            namedExports.push(specifier.exported.name);
          }
        }
      }

      // Inspect the package directory to get a list of top-level, public
      // module basenames.
      const topLevelFiles = glob
        .sync(`*.${ext}`, {
          ignore: ['index', 'types', '_types', '_version'].map(
            (file) => `${file}.${ext}`,
          ),
          cwd: packagePath,
        })
        .map((file) => path.basename(file, `.${ext}`));

      // Assert there's a 1-to-1 mapping between exports and top-level files.
      expect(namedExports.sort()).to.deep.equal(topLevelFiles.sort());
    }
  });

  it(`should have top a level module for every export in _private.mjs (and vise-versa)`, async function () {
    for (const pkg of windowAndSWPackages) {
      // TODO(philipwalton): remove this once all packages are converted to
      // typescript or typescript adds `.mjs` support.
      const ext = 'types' in pkg ? 'js' : 'mjs';

      const packagePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'packages',
        pkg.name,
      );
      const privateFile = path.join(packagePath, `_private.${ext}`);

      // Only some packages have a `_private.mjs` module.
      if (!fs.existsSync(privateFile)) {
        continue;
      }

      const privateContents = await fs.readFile(privateFile, 'utf-8');

      // Use the acorn parser to generate a list of named exports.
      const namedExports = [];
      const indexAST = acorn.parse(privateContents, {
        ecmaVersion: 6,
        sourceType: 'module',
      });
      for (const node of indexAST.body) {
        if (node.type === 'ExportDefaultDeclaration') {
          throw new Error(
            `'_private.${ext}' files cannot contain default exports`,
          );
        }
        if (node.type === 'ExportNamedDeclaration') {
          if (node.specifiers.length === 0) {
            throw new Error(
              `'_private.${ext}' files may only contain a single, named-export block`,
            );
          }
          for (const specifier of node.specifiers) {
            namedExports.push(specifier.exported.name);
          }
        }
      }

      // Inspect the package directory to get a list of top-level, public
      // module basenames.
      const privateDirectoryPath = path.join(packagePath, '_private');
      const topLevelFiles = glob
        .sync(`*.${ext}`, {cwd: privateDirectoryPath})
        .map((file) => path.basename(file, `.${ext}`));

      // Assert there's a 1-to-1 mapping between exports and top-level files.
      expect(namedExports.sort()).to.deep.equal(topLevelFiles.sort());
    }
  });
});

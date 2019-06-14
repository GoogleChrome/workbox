/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

describe(`[workbox-build] lib/create-module-imports.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/module-registry';
  let moduleRegistry;

  beforeEach(() => {
    const ModuleRegistry = proxyquire(MODULE_PATH, {
      path: {
        posix: {
          resolve: () => '/path/to/node_modules',
        },
      },
    });
    moduleRegistry = new ModuleRegistry();
  });

  describe(`getImportStatements()`, function() {
    it(`should return [] when nothing is used`, function() {
      expect(moduleRegistry.getImportStatements()).to.be.empty;
    });

    it(`return the expected output given multiple calls to use()`, function() {
      const module1Name = moduleRegistry.use('a-b-c', 'd');
      // Multiple use()s should result in only one entry.
      moduleRegistry.use('a-b-c', 'd');
      const module2Name = moduleRegistry.use('x-y', 'z');

      const importStatements = moduleRegistry.getImportStatements();

      expect(importStatements).to.have.members([
        `import {d as a_b_c_d} from '/path/to/node_modules/a-b-c/d.mjs';`,
        `import {z as x_y_z} from '/path/to/node_modules/x-y/z.mjs';`,
      ]);

      expect(importStatements[0]).to.contain(module1Name);
      expect(importStatements[1]).to.contain(module2Name);
    });
  });

  describe(`getLocalName()`, function() {
    it(`should return the expected name`, function() {
      expect(moduleRegistry.getLocalName('a-b-c', 'd')).to.eql('a_b_c_d');
    });

    it(`should return the expected name when called via use()`, function() {
      expect(moduleRegistry.use('a-b-c', 'd')).to.eql('a_b_c_d');
    });
  });
});

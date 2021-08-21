/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const upath = require('upath');

const {
  ModuleRegistry,
} = require('../../../../packages/workbox-build/build/lib/module-registry');

describe(`[workbox-build] lib/module-registry.js`, function () {
  let moduleRegistry;
  // We can't use proxyquire to override require.resolve(), so let's get the
  // actual expected base path that will be used in the test cases.
  const basePath = upath.resolve(__dirname, '..', '..', '..', '..');

  beforeEach(() => {
    moduleRegistry = new ModuleRegistry();
  });

  describe(`getImportStatements()`, function () {
    it(`should return [] when nothing is used`, function () {
      expect(moduleRegistry.getImportStatements()).to.be.empty;
    });

    it(`return the expected output given multiple calls to use()`, function () {
      const module1Name = moduleRegistry.use('workbox-core', 'index');
      // Multiple use()s should result in only one entry.
      moduleRegistry.use('workbox-core', 'index');
      const module2Name = moduleRegistry.use('workbox-routing', 'index');

      const importStatements = moduleRegistry.getImportStatements();

      expect(importStatements).to.have.members([
        `import {index as workbox_core_index} from '${basePath}/packages/workbox-core/index.mjs';`,
        `import {index as workbox_routing_index} from '${basePath}/packages/workbox-routing/index.mjs';`,
      ]);

      expect(importStatements[0]).to.contain(module1Name);
      expect(importStatements[1]).to.contain(module2Name);
    });
  });

  describe(`getLocalName()`, function () {
    it(`should return the expected name`, function () {
      expect(moduleRegistry.getLocalName('a-b-c', 'd')).to.eql('a_b_c_d');
    });

    it(`should return the expected name when called via use()`, function () {
      expect(moduleRegistry.use('a-b-c', 'd')).to.eql('a_b_c_d');
    });
  });
});

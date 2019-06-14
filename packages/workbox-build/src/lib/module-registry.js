/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const ol = require('common-tags').oneLine;
const path = require('path');

/**
 * Class for keeping track of which Workbox modules are used by the generated
 * service worker script.
 */
class ModuleRegistry {
  /**
   * Basic constructor.
   */
  constructor() {
    this.modulesUsed = new Map();
    this.nodeModulesPath = path.posix.resolve(
        __dirname, '..', '..', 'node_modules');
  }

  /**
   * @return {Array<string>} A list of all of the import statements that are
   * needed for the modules being used.
   */
  getImportStatements() {
    const workboxModuleImports = [];

    for (const [localName, {moduleName, pkg}] of this.modulesUsed) {
      const importStatement = ol`import {${moduleName} as ${localName}} from
        '${this.nodeModulesPath}/${pkg}/${moduleName}.mjs';`;

      workboxModuleImports.push(importStatement);
    }

    return workboxModuleImports;
  }

  /**
   * @param {string} pkg The workbox package that the module belongs to.
   * @param {string} moduleName The name of the module to import.
   * @return {string} The local variable name that corresponds to that module.
   */
  getLocalName(pkg, moduleName) {
    return `${pkg.replace(/-/g, '_')}_${moduleName}`;
  }

  /**
   * @param {string} pkg The workbox package that the module belongs to.
   * @param {string} moduleName The name of the module to import.
   * @return {string} The local variable name that corresponds to that module.
   */
  use(pkg, moduleName) {
    const localName = this.getLocalName(pkg, moduleName);
    this.modulesUsed.set(localName, {moduleName, pkg});

    return localName;
  }
}

module.exports = ModuleRegistry;

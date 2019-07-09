/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// Adapted from https://github.com/GoogleChromeLabs/proxx/blob/5d5847e8550ddce10c5c8542d6b314e0a1ff9ef6/lib/loadz0r-loader.ejs
module.exports = `// If the loader is already loaded, just stop.
if (!self.define) {
  const singleRequire = (name) => {
    // Something has changed in the Rollup AMD stuff. This fixes it:
    if (name !== 'require') {
      name = name + '.js';
    }

    return Promise.resolve()
      .then(() => {
        if (registry[name]) {
          return;
        }

        importScripts(name);
      }).then(() => {
        if (!registry[name]) {
          throw new Error('Module ' + name + ' did not register its module');
        }
        return registry[name];
      });
  };

  const require = (names, resolve) => {
    Promise.all(names.map(singleRequire))
      .then(modules => modules.length === 1 ? modules[0] : modules)
      .then(result => resolve(result));
  };

  const registry = {
    require: Promise.resolve(require)
  };

  self.define = (moduleName, depsNames, factory) => {
    if (registry[moduleName]) {
      // Module is already loading or loaded.
      return;
    }
    registry[moduleName] = new Promise(resolve => {
      let exports = {};
      const module = {
        uri: location.origin + moduleName.slice(1)
      };
      Promise.all(
        depsNames.map(depName => {
          if (depName === 'exports') {
            return exports;
          }
          if (depName === 'module') {
            return module;
          }
          return singleRequire(depName);
        })
      ).then(deps => {
        factory(...deps);
        resolve(exports);
      });
    });
  };
}`;

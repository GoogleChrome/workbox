/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// A small helper class to generate a "fake" webpack asset for testing purposes.
// Roughly equivalent to https://www.npmjs.com/package/generate-asset-webpack-plugin,
// but this uses the webpack v4 syntax.

class CreateWebpackAssetPlugin {
  constructor(name) {
    if (typeof name !== 'string') {
      throw new Error('Please pass in a string.');
    }
    this.name = name;
  }

  apply(compiler) {
    compiler.hooks.emit.tap(
      this.constructor.name,
      (compilation) =>
        (compilation.assets[this.name] = {
          source: () => this.name,
          size: () => this.name.length,
        }),
    );
  }
}

module.exports = CreateWebpackAssetPlugin;

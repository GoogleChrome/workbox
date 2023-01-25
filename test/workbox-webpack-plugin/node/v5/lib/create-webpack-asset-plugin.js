/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {sources} = require('webpack');

class CreateWebpackAssetPlugin {
  constructor(name) {
    if (typeof name !== 'string') {
      throw new Error('Please pass in a string.');
    }
    this.name = name;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(this.constructor.name, (compilation) =>
      compilation.emitAsset(this.name, new sources.RawSource(this.name)),
    );
  }
}

module.exports = CreateWebpackAssetPlugin;

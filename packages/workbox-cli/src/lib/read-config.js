"use strict";
/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConfig = void 0;
// A really light wrapper on top of Node's require() to make it easier to stub
// out reading the configuration during tests.
function readConfig(configFile) {
    return require(configFile);
}
exports.readConfig = readConfig;
;

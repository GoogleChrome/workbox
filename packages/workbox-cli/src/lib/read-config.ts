/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// A really light wrapper on top of Node's require() to make it easier to stub
// out reading the configuration during tests.
export function readConfig(configFile: string) {
  return require(configFile)
}

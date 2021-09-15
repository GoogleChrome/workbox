/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import chalk from 'chalk';
import tinydate from 'tinydate';

const timestamp = tinydate('[{HH}:{mm}:{ss}]');

export function log(...args: Array<unknown>): void {
  console.log(chalk.dim(timestamp(new Date())), ...args);
}

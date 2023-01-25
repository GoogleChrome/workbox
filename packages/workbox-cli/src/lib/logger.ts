/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import chalk from 'chalk';

export const logger = {
  debug: (...args: string[]): void => console.log(chalk.gray(...args)),
  log: (...args: string[]): void => console.log(...args),
  warn: (...args: string[]): void => console.warn(chalk.yellow(...args)),
  error: (...args: string[]): void => console.error(chalk.red.bold(...args)),
};

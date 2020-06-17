"use strict";
/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const chalk = require("chalk");
exports.logger = {
    debug: (...args) => console.log(chalk.gray(...args)),
    log: (...args) => console.log(...args),
    warn: (...args) => console.warn(chalk.yellow(...args)),
    error: (...args) => console.error(chalk.red.bold(...args)),
};

/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {hideBin} from 'yargs/helpers';
import {loadConfig} from './lib/load-config';
import yargs from 'yargs';

async function main() {
  const argv = await yargs(hideBin(process.argv)).argv;
  const tasks = argv['_'].length > 0 ? argv['_'] : ['default'];

  const config = await loadConfig(argv.taskFile as string);
  if (config === null) {
    throw new Error(`Unable to load config file.`);
  }

  const invalidTaskNames = tasks.filter((taskName) => !(taskName in config));
  if (invalidTaskNames.length > 0) {
    throw new Error(`Invalid task names: ${invalidTaskNames.join(', ')}`);
  }

  for (const task of tasks) {
    await config[task](argv);
  }
}

main().catch((err: unknown) => {
  console.error(err.toString());
  process.exit(1);
});

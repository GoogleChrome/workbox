/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {hideBin} from 'yargs/helpers';
import yargs from 'yargs';

import {loadConfig} from './lib/load-config';
import {series} from './lib/series';
import {TaskArgs} from './index';

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

  const param: TaskArgs = Object.assign({}, argv);
  delete param['$0'];
  delete param['_'];

  await series(...tasks.map((task) => config[task]))(param);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.toString() : err);
  process.exit(1);
});

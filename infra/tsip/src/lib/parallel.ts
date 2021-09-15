/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {TaskArgs} from 'yargs';

import {Task} from '../index';
import {TaskLogger} from './TaskLogger';

export function parallel(...funcs: Array<Task>): Task {
  return async function _(args: TaskArgs) {
    const promises = [];

    for (const func of funcs) {
      const taskLogger = new TaskLogger(func);

      promises.push(
        Promise.resolve()
          .then(() => taskLogger.logStart())
          .then(() => func(args))
          .then(() => taskLogger.logEnd())
          .catch((err) => {
            taskLogger.logError();
            throw err;
          }),
      );
    }

    await Promise.all(promises);
  };
}

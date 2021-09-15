/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Task, TaskArgs} from '../index';
import {TaskLogger} from './TaskLogger';

export function series(...funcs: Array<Task>): Task {
  return async function _(args: TaskArgs) {
    for (const func of funcs) {
      const taskLogger = new TaskLogger(func);

      try {
        taskLogger.logStart();
        await func(args);
        taskLogger.logEnd();
      } catch (err: unknown) {
        taskLogger.logError();
        throw err;
      }
    }
  };
}

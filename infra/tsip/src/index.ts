/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {log} from './lib/log';
import {series} from './lib/series';
import {parallel} from './lib/parallel';

type TaskArgs = Record<string, unknown> & {stuff: Record<string, unknown>};
type TaskReturn = void | Promise<void>;
type Task = (args: TaskArgs) => TaskReturn;

export {TaskArgs, Task, TaskReturn, log, parallel, series};

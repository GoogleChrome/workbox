/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Arguments} from 'yargs';

import {log} from './lib/log';
import {series} from './lib/series';
import {parallel} from './lib/parallel';

type TaskReturn = void | Promise<void>;
type Task = (args: Arguments) => TaskReturn;

export {Arguments, Task, TaskReturn, log, parallel, series};

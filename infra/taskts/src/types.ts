/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Arguments} from 'yargs';
export {Arguments};

export type TaskReturn = void | Promise<void>;
export type Task = (args: Arguments) => TaskReturn;

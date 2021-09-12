/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Arguments} from 'yargs';

import {Task} from '../index';

export function parallel(...funcs: Array<Task>): Task {
  return async (args: Arguments) => {
    await Promise.all(funcs.map((func) => func(args)));
  };
}

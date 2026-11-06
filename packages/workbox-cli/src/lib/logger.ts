/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {styleText} from 'util';

export const logger = {
  debug: (...args: string[]): void =>
    console.log(styleText('gray', args.join(' '))),
  log: (...args: string[]): void => console.log(...args),
  warn: (...args: string[]): void =>
    console.warn(styleText('yellow', args.join(' '), {stream: process.stderr})),
  error: (...args: string[]): void =>
    console.error(
      styleText(['red', 'bold'], args.join(' '), {stream: process.stderr}),
    ),
};

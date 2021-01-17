/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import crypto from 'crypto';

export function getStringHash(str: string): string {
  const md5 = crypto.createHash('md5');
  md5.update(str);
  return md5.digest('hex');
};

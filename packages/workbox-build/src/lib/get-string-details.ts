/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import getStringHash from './get-string-hash';

import {FileDetails} from '../types';

export default function(url: string, str: string): FileDetails {
  return {
    file: url,
    hash: getStringHash(str),
    size: str.length,
  };
};

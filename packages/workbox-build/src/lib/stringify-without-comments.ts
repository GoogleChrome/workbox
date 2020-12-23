/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import objectStringify from 'stringify-object';
import stripComments from 'strip-comments';

export default function(obj: {[key: string]: any}): string {
  return objectStringify(obj, {
    transform: (_obj: {[key: string]: any}, _prop: string, str: string) =>
      typeof _obj[_prop] === 'function' ? stripComments(str) : str,
  });
};

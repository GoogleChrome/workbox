/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.js';


export interface WorkboxStrategyHandleOptions {
  request: Request;
  event?: ExtendableEvent;
}

export interface WorkboxStrategy {
  handle({event, request}: WorkboxStrategyHandleOptions): Promise<Response>;
  makeRequest({event, request}: WorkboxStrategyHandleOptions): Promise<Response>;
}

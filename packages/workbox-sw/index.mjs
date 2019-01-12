/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxSW} from './controllers/WorkboxSW.mjs';
import './_version.mjs';

// NOTE: workbox-sw needs to use a default export rather than named exports
// because it's a proxy. But it's OK for workbox-sw to break from the
// convention of only using named exports because workbox-sw should never be
// imported by module bundlers (since workbox-sw is a script loader, and anyone
// using a bundler to build their SW wouldn't need it).
export default new WorkboxSW();

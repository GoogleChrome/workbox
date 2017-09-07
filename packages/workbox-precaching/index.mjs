import {_private} from 'workbox-core';
import core from 'workbox-core';

if (process.env.NODE_ENV !== 'prod') {
  if (!core.assert.isSWEnv()) {
    throw new _private.WorkboxError(
      'not-in-sw', {moduleName: 'workbox-precaching'});
  }
}

export default {};

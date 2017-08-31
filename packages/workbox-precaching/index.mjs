import WorkboxError from 'workbox-core/internal/models/WorkboxError';
import core from 'workbox-core';

if (process.env.NODE_ENV !== 'prod') {
  if (!core.assert.isServiceWorkerEnvironment()) {
    throw new WorkboxError('not-in-sw', 'workbox-precaching');
  }
}

export default () => {};

import core from 'workbox-core';

if (process.env.NODE_ENV !== 'prod') {
  core.assert.isSWEnv('workbox-precaching');
}

export default {};

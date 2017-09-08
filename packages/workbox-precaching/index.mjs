import core from 'workbox-core';
import PrecacheController from './controllers/PrecacheController.mjs';

if (process.env.NODE_ENV !== 'production') {
  core.assert.isSwEnv('workbox-precaching');
}

export {
  PrecacheController,
};

export default {};

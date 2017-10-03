import core from 'workbox-core';
import PrecacheController from './controllers/PrecacheController.mjs';
import defaultPrecachingExport from './default-precaching-export.mjs';

/**
 * @module workbox-precaching
 */

if (process.env.NODE_ENV !== 'production') {
  core.assert.isSwEnv('workbox-precaching');
}

export {
  PrecacheController,
};

export default defaultPrecachingExport;

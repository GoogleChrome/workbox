import core from 'workbox-core';
import Route from './lib/Route.mjs';
import Router from './lib/Router.mjs';
import defaultExport from './default-export.mjs';

/**
 * @module workbox-routing
 */

if (process.env.NODE_ENV !== 'production') {
  core.assert.isSwEnv('workbox-routing');
}

export {
  Route,
  Router,
};

export default defaultExport;

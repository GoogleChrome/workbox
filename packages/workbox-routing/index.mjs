import core from 'workbox-core';
import Route from './lib/Route.mjs';

if (process.env.NODE_ENV !== 'production') {
  core.assert.isSwEnv('workbox-routing');
}

export {
  Route,
};

export default {};

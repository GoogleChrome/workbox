import {hasMethod, isType} from '../../../../lib/assert';

/**
 * @param {function|module:workbox-runtime-caching.Handler} handler The
 * handler to normalize.
 * @return {Object} An object with a `handle` property representing the handler
 * function.
 */
export default function normalizeHandler(handler) {
  if (typeof handler === 'object') {
    hasMethod({handler}, 'handle');
    return handler;
  } else {
    isType({handler}, 'function');
    return {handle: handler};
  }
}

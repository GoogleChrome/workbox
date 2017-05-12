import assert from '../../../../lib/assert';

/**
 * @param {RouteHandler} handler The handler to normalize.
 * @return {Object} An object with a `handle` property representing the handler
 * function.
 */
export default function normalizeHandler(handler) {
  if (typeof handler === 'object') {
    assert.hasMethod({handler}, 'handle');
    return handler;
  } else {
    assert.isType({handler}, 'function');
    return {handle: handler};
  }
}

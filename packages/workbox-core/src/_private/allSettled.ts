import '../_version.js';

export interface PromiseResolution<T> {
  status: 'fulfilled';
  value: T;
}

export interface PromiseRejection {
  status: 'rejected';
  reason: unknown;
}

export type PromiseResult<T> = PromiseResolution<T> | PromiseRejection;

/**
 * Promise.allSettled polyfill based on
 *
 * https://github.com/es-shims/Promise.allSettled/blob/main/implementation.js
 *
 * which is (c) 2019 Jordan Harband and used under the terms of the MIT license.
 *
 * @private
 */
function allSettled<T>(
  iterable: Iterable<Promise<T>>,
): Promise<PromiseResult<T>[]> {
  const values = Array.from(iterable);
  return Promise.all(
    values.map(function (item) {
      const onFulfill = function (value: T) {
        return {status: 'fulfilled' as const, value: value};
      };
      const onReject = function (reason: unknown) {
        return {status: 'rejected' as const, reason: reason};
      };
      const itemPromise = Promise.resolve(item);
      try {
        return itemPromise.then(onFulfill, onReject);
      } catch (e) {
        return Promise.reject(e);
      }
    }),
  );
}

export {allSettled};

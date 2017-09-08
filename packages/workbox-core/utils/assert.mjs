import WorkboxError from '../models/WorkboxError.mjs';

/*
 * This method returns true if the current context is a service worker.
 */
const isSwEnv = (moduleName) => {
  if (!(typeof ServiceWorkerGlobalScope !== 'undefined' &&
    self instanceof ServiceWorkerGlobalScope)) {
      throw new WorkboxError('not-in-sw', {moduleName});
  }
};

/*
 * This method throws if the supplied value is not an array.
 * The destructed values are required to produce a meaningful error for users.
 * The destructed and restructured object is so it's clear what is
 * needed.
 */
const isArray = (value, {moduleName, className, funcName, paramName}) => {
  if (!Array.isArray(value)) {
    throw new WorkboxError('not-an-array', {
      moduleName,
      className,
      funcName,
      paramName,
    });
  }
};

export default {
  isSwEnv,
  isArray,
};

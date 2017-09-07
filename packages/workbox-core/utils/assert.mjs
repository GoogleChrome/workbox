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

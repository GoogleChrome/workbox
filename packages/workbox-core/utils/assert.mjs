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

const hasMethod = (object, expectedMethod,
                   {moduleName, funcName, paramName}) => {
  const type = typeof object[expectedMethod];
  if (type !== 'function') {
    throw new WorkboxError('not-a-method', {paramName, expectedMethod,
      moduleName, funcName});
  }
};

const isType = (object, expectedType,
                {moduleName, funcName, paramName}) => {
  if (typeof object !== expectedType) {
    throw new WorkboxError('not-of-type', {paramName, expectedType,
      moduleName, funcName});
  }
};

const isOneOf = (value, validValues, {paramName}) => {
  if (!validValues.includes(value)) {
    throw new WorkboxError('invalid-value', {
      paramName,
      value,
      validValueDescription: `Valid values are ${JSON.stringify(validValues)}.`,
    });
  }
};

export default {
  hasMethod,
  isArray,
  isOneOf,
  isSwEnv,
  isType,
};

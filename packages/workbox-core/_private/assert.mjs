/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxError} from '../_private/WorkboxError.mjs';
import '../_version.mjs';

/*
 * This method returns true if the current context is a service worker.
 */
const isSWEnv = (moduleName) => {
  if (!('ServiceWorkerGlobalScope' in self)) {
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
    {moduleName, className, funcName, paramName}) => {
  const type = typeof object[expectedMethod];
  if (type !== 'function') {
    throw new WorkboxError('missing-a-method', {paramName, expectedMethod,
      moduleName, className, funcName});
  }
};

const isType = (object, expectedType,
    {moduleName, className, funcName, paramName}) => {
  if (typeof object !== expectedType) {
    throw new WorkboxError('incorrect-type', {paramName, expectedType,
      moduleName, className, funcName});
  }
};

const isInstance = (object, expectedClass,
    {moduleName, className, funcName,
      paramName, isReturnValueProblem}) => {
  if (!(object instanceof expectedClass)) {
    throw new WorkboxError('incorrect-class', {paramName, expectedClass,
      moduleName, className, funcName, isReturnValueProblem});
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

const isArrayOfClass = (value, expectedClass,
    {moduleName, className, funcName, paramName}) => {
  const error = new WorkboxError('not-array-of-class', {
    value, expectedClass,
    moduleName, className, funcName, paramName,
  });
  if (!Array.isArray(value)) {
    throw error;
  }

  for (let item of value) {
    if (!(item instanceof expectedClass)) {
      throw error;
    }
  }
};

const finalAssertExports = process.env.NODE_ENV === 'production' ? null : {
  hasMethod,
  isArray,
  isInstance,
  isOneOf,
  isSWEnv,
  isType,
  isArrayOfClass,
};

export {finalAssertExports as assert};

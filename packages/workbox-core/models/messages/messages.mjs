export default {
  'invalid-type': ({paramName, expectedType, value}) => {
    if (!paramName || !expectedType) {
      throw new Error(`Unexpected input to 'invalid-type' error.`);
    }
    return `The '${paramName}' parameter was given a value with an ` +
      `unexpected type. Expected Type: '${expectedType}' but received a ` +
      `value of ${JSON.stringify(value)}.`;
  },

  'invalid-value': ({paramName, validValueDescription, value}) => {
    if (!paramName || !validValueDescription) {
      throw new Error(`Unexpected input to 'invalid-value' error.`);
    }
    return `The '${paramName}' parameter was given a value with an ` +
      `unexpected value. ${validValueDescription} Received a value of ` +
      `${JSON.stringify(value)}.`;
  },

  'not-in-sw': ({moduleName}) => {
    if (!moduleName) {
      throw new Error(`Unexpected input to 'not-in-sw' error.`);
    }
    return `The '${moduleName}' must be used in a service worker.`;
  },

  'not-an-array': ({moduleName, className, funcName, paramName}) => {
    if (!moduleName || !className || !funcName || !paramName) {
      throw new Error(`Unexpected input to 'not-an-array' error.`);
    }
    return `The parameter '${paramName}' passed into ` +
      `'${moduleName}.${className}.${funcName}()' must be an array.`;
  },

  'incorrect-type': ({expectedType, paramName, moduleName, className,
                   funcName}) => {
    if (!expectedType || !paramName || !moduleName || !className || !funcName) {
      throw new Error(`Unexpected input to 'not-of-type' error.`);
    }
    return `The parameter '${paramName}' passed into ` +
      `'${moduleName}.${className}.${funcName}()' must be of type ` +
      `${expectedType}.`;
  },

  'missing-a-method': ({expectedMethod, paramName, moduleName, className,
                    funcName}) => {
    if (!expectedMethod || !paramName || !moduleName || !className
        || !funcName) {
      throw new Error(`Unexpected input to 'not-a-method' error.`);
    }
    return `${moduleName}.${className}.${funcName}() expected the ` +
      `'${paramName}' parameter to expose a '${expectedMethod}' method.`;
  },

  'add-to-cache-list-unexpected-type': ({entry}) => {
    return `An unexpected entry was passed to ` +
    `'workbox-precaching.PrecacheController.addToCacheList()' The entry ` +
    `'${JSON.stringify(entry)}' isn't supported. You must supply an array of ` +
    `strings with one or more characters, objects with a url property or ` +
    `Request objects.`;
  },

  'add-to-cache-list-conflicting-entries': ({firstEntry, secondEntry}) => {
    if (!firstEntry || !secondEntry) {
      throw new Error(`Unexpected input to ` +
        `'add-to-cache-list-duplicate-entries' error.`);
    }

    return `Two of the entries passed to ` +
      `'workbox-precaching.PrecacheController.addToCacheList()' had matching ` +
      `URLs but different revision details. This means workbox-precaching ` +
      `is unable to determine cache the asset correctly. Please remove one ` +
      `of the entries.`;
  },

  'plugin-error-request-will-fetch': ({thrownError}) => {
    if (!thrownError) {
      throw new Error(`Unexpected input to ` +
        `'plugin-error-request-will-fetch', error.`);
    }

    return `An error was thrown by a plugins 'requestWillFetch()' method. ` +
      `The thrown error message was: '${thrownError.message}'.`;
  },

  'invalid-cache-name': ({cacheNameId, value}) => {
    if (!cacheNameId) {
      throw new Error(
        `Expected a 'cacheNameId' for error 'invalid-cache-name'`);
    }

    return `You must provide a name containing at least one character for ` +
      `setCacheDeatils({${cacheNameId}: '...'}). Received a value of ` +
      `'${JSON.stringify(value)}'`;
  },
};

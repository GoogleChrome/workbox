export default {
  'invalid-type': ({paramName, expectedType, value}) => {
    if (!paramName || !expectedType) {
      throw new Error(`Unexpected input to 'invlaid-type' error.`);
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

  'not-of-type': ({paramName, expectedType, moduleName, funcName}) => {
    if (!paramName || !expectedType || !moduleName || !funcName) {
      throw new Error(`Unexpected input to 'not-of-type' error.`);
    }
    return `The parameter '${paramName}' passed into ` +
      `'${moduleName}.${funcName}()' must be of type ${expectedType}.`;
  },

  'not-a-method': ({paramName, expectedMethod, moduleName, funcName}) => {
    if (!paramName || !expectedMethod || !moduleName || !funcName) {
      throw new Error(`Unexpected input to 'not-a-method' error.`);
    }
    return `${moduleName}.${funcName}() was called with a ${paramName} that ` +
      `doesn't expose a ${expectedMethod} method.`;
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
};

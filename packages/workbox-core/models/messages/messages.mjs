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
};

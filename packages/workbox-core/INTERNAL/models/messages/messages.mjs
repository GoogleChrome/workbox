export default {
  'invalid-type': ({paramName, expectedType, value}) => {
    if (!paramName || !expectedType || !value) {
      throw new Error(`Unexpected input to 'invlaid-type' error.`);
    }
    return `The '${paramName}' parameter was given a value with an ` +
      `unexpected type. Expected Type: '${expectedType}' but received a ` +
      `value of ${JSON.stringify(value)}.`;
  },

  'invalid-value': ({paramName, validValueDescription, value} = {}) => {
    if (!paramName || !validValueDescription || !value) {
      throw new Error(`Unexpected input to 'invlaid-value' error.`);
    }
    return `The '${paramName}' parameter was given a value with an ` +
      `unexpected value. ${validValueDescription} Received a value of ` +
      `${JSON.stringify(value)}.`;
  },
};

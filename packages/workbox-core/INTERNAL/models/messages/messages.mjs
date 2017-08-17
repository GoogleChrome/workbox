export default {
  'welcome-message': 'Welcome to Workbox!',
  'invalid-type': ({paramName, expectedType, value} = {}) => {
    let baseMessage = 'An argument was given a value with an unexpected ' +
      'type. Please check the stack trace for more info.';

    if (paramName) {
      baseMessage =
        `The '${paramName}' parameter was given a value with an ` +
        `unexpected type.`;
    }

    if (expectedType) {
      baseMessage += ` Expected a '${expectedType}' value.`;
    }

    if (typeof value !== undefined) {
      baseMessage += ` Received ${JSON.stringify(value)}.`;
    }

    return baseMessage;
  },

  'invalid-value': ({paramName, validValueDescription, value} = {}) => {
    let baseMessage = 'An argument was given a value with an invalid ' +
      'value. Please check the stack trace for more info.';

    if (paramName) {
      baseMessage =
        `The '${paramName}' parameter was given a value with an ` +
        `unexpected value.`;
    }

    if (validValueDescription) {
      baseMessage += ` ${validValueDescription}`;
    }

    if (typeof value !== undefined) {
      baseMessage += ` Received ${JSON.stringify(value)}.`;
    }

    return baseMessage;
  },
};

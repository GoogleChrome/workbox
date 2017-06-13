const ERRORS = {
  'not-in-sw': {
    message: 'workbox-precaching must be loaded in your service worker file.',
  },
  'invalid-object-entry': {
    message: (extras) => {
      return `Precache entries entered as an object must have a 'url' and ` +
      `'revision' parameter. The '${extras.problemParam}' parameter has an ` +
      `invalid value of '${extras.problemValue}'.`;
    },
  },
  'invalid-string-entry': {
    message: (extras) => {
      return `Precache entries entered as strings must have at least ` +
        `one character. Received url of '${extras.url}'`;
    },
  },
  'invalid-request-entry': {
    message: (extras) => {
      return `Precache entry was coerced as a RequestCacheEntry but the type ` +
        `received was not a Request. Received url of '${extras.url}'`;
    },
  },
  'bad-cache-bust': {
    message: `The cache bust parameter must be a boolean.`,
  },
  'duplicate-entry-diff-revisions': {
    message: (extras) => {
      return `An attempt was made to cache the same ` +
        `url twice with each having different revisions. This is not ` +
        `supported. First entry was: ` +
        `'${JSON.stringify(extras.firstEntry)}' and the second entry was ` +
        `'${JSON.stringify(extras.secondEntry)}'`;
    },
  },
  'request-not-cached': {
    message: (extras) => {
      return `The request fpr '${extras.url}' failed the criteria to be ` +
        `cached. By default, only responses with 'response.ok = true' ` +
        `are cached.`;
    },
  },
  'requires-overriding': {
    message: 'Method should be overridden by the extending class.',
  },
  'bad-cache-id': {
    message: (extras) => {
      return `The 'cacheId' parameter must be a string with at least ` +
      `one character. Received '${JSON.stringify(extras.cacheId)}'.`;
    },
  },
  'unexpected-precache-entry': {
    message: (extras) => {
      return `One of the precache entries had an unexpected type of: ` +
      `'${typeof extras.input}'`;
    },
  },
};

const errorMessageFactory = (errorCode, extras) => {
  const errorDetails = ERRORS[errorCode];
  if (!errorDetails) {
    return `An error was thrown by workbox with error code: '${errorCode}'.`;
  }

  const errorMessage = errorDetails.message;
  if (typeof errorMessage === 'function') {
    return errorMessage(extras);
  } else {
    return errorMessage;
  }
};

export default errorMessageFactory;

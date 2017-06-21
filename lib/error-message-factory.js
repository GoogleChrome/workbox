const ERRORS = {
  'not-in-sw': {
    message: 'workbox-precaching must be loaded in your service worker file.',
  },
  'invalid-object-entry': {
    message: (context) => {
      return `Precache entries entered as an object must have a 'url' and ` +
      `'revision' parameter. The '${context.problemParam}' parameter has an ` +
      `invalid value of '${context.problemValue}'.`;
    },
  },
  'invalid-string-entry': {
    message: (context) => {
      return `Precache entries entered as strings must have at least ` +
        `one character. Received url of '${context.url}'`;
    },
  },
  'invalid-request-entry': {
    message: (context) => {
      return `Precache entry was coerced as a RequestCacheEntry but the type ` +
        `received was not a Request. Received url of '${context.url}'`;
    },
  },
  'bad-cache-bust': {
    message: `The cache bust parameter must be a boolean.`,
  },
  'duplicate-entry-diff-revisions': {
    message: (context) => {
      return `An attempt was made to cache the same ` +
        `url twice with each having different revisions. This is not ` +
        `supported. First entry was: ` +
        `'${JSON.stringify(context.firstEntry)}' and the second entry was ` +
        `'${JSON.stringify(context.secondEntry)}'`;
    },
  },
  'request-not-cached': {
    message: (context) => {
      return `The request fpr '${context.url}' failed the criteria to be ` +
        `cached. By default, only responses with 'response.ok = true' ` +
        `are cached.`;
    },
  },
  'requires-overriding': {
    message: 'Method should be overridden by the extending class.',
  },
  'bad-cache-id': {
    message: (context) => {
      return `The 'cacheId' parameter must be a string with at least ` +
      `one character. Received '${JSON.stringify(context.cacheId)}'.`;
    },
  },
  'unexpected-precache-entry': {
    message: (context) => {
      return `One of the precache entries had an unexpected type of: ` +
      `'${typeof context.input}'`;
    },
  },
};

const errorMessageFactory = (code, context) => {
  const errorDetails = ERRORS[code];
  if (!errorDetails) {
    return `An error was thrown by workbox with error code: '${code}'.`;
  }

  const errorMessage = typeof errorDetails.message === 'function' ?
    errorDetails.message(context) :
    errorDetails.message;
  return errorMessage.replace(/\s+/g, ' ');
};

export default errorMessageFactory;

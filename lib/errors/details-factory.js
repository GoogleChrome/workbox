const ERRORS = {
  'not-in-sw': {
    message: 'workbox-precaching must be loaded in your service worker file.',
  },
  'invalid-revisioned-entry': {
    message: (extras) => {
      return `File manifest entries must be either a ` +
      `string with revision info in the url or an object with a 'url' and ` +
      `'revision' parameters. Received a revision of ` +
      `'${extras.revision}' for url '${extras.url}' with ID '${extras.entryID}'`;
    },
  },
  'invalid-unrevisioned-entry': {
    message: ``,
  },
  'bad-cache-bust': {
    message: `The cache bust parameter must be a boolean.`,
  },
  'duplicate-entry-diff-revisions': {
    message: `An attempt was made to cache the same ` +
      `url twice with each having different revisions. This is not supported.`,
  },
  'request-not-cached': {
    message: `A request failed the criteria to be cached. By ` +
    `default, only responses with 'response.ok = true' are cached.`,
  },
  'should-override': {
    message: 'Method should be overridden by the extending class.',
  },
  'bad-cache-id': {
    message: `The 'cacheId' parameter must be a string with at least ` +
      `one character.`,
  },
};

const errorDetailsFactory = (errorCode, extras) => {
  const errorDetails = ERRORS[errorCode];
  if (!errorDetails) {
    return null;
  }

  const errorMessage = errorDetails.message;
  if (typeof errorMessage === 'function') {
    return errorMessage(extras);
  } else {
    return errorMessage;
  }
};

export default errorDetailsFactory;

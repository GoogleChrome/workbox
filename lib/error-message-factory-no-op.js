const errorMessageFactory = (errorCode, extras) => {
  return `An error was thrown by workbox with error code: '${errorCode}' and extras: '${JSON.stringify(extras)}'.`;
};

export default errorMessageFactory;

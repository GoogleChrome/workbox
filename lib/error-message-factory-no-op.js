const errorMessageFactory = (code, context) => {
  let message = `An error was thrown by workbox with error code: ` +
    `;'${code}'`;
  if (context) {
    message += ` with extras: '${JSON.stringify(context)}'`;
  }
  return message;
};

export default errorMessageFactory;

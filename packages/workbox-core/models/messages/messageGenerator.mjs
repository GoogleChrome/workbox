import messages from './messages.mjs';

const fallback = (code, ...args) => {
  let msg = code;
  if (args.length > 0) {
    msg += ` :: ${JSON.stringify(args)}`;
  }
  return msg;
};

const generatorFunction = (code, ...args) => {
  const message = messages[code];
  if (!message) {
    throw new Error(`Unable to find message for code '${code}'.`);
  }

  return message(...args);
};

const exportedValue = (process.env.NODE_ENV === 'production') ?
  fallback : generatorFunction;

export default exportedValue;

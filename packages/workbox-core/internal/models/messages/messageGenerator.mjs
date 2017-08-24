import messages from './_messages.mjs';
import core from '../../../index.mjs';

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
    core.INTERNAL.logHelper.warn(`Unable to find message for code '${code}'`);
    return fallback(code, ...args);
  }

  try {
    return message(...args);
  } catch (err) {
    core.INTERNAL.logHelper.warn(
      `Unable to generate full error message.`, err);
    return fallback(code, ...args);
  }
};

const exportedValue = (process.env.NODE_ENV === 'prod') ?
  fallback : generatorFunction;

export default exportedValue;

module.exports = async (command, ...args) => {
  const result = await global.__workbox.webdriver.executeAsyncScript((command, args, cb) => {
    if (!('_runInSW' in window)) {
      cb({error: '_runInSW is not initialized.'});
    } else {
      window._runInSW[command](...args)
          .then((result) => cb(result))
          .catch((error) => cb({
            error: `While running ${command}(${args}): ${error.message}`,
          }));
    }
  }, command, args);

  if (result instanceof Object && 'error' in result) {
    throw new Error(result.error);
  }
  return result;
};

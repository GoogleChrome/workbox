const spawn = require('child_process').spawn;
const logHelper = require('../../infra/utils/log-helper');

module.exports = (command, args, options = {}) => {
  options.stdio = options.stdio || 'inherit';
  return new Promise((resolve, reject) => {
    logHelper.log(`Spawning command: `, command);
    const process = spawn(command, args, options);
    process.on('error', reject);
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Error ${code} returned from ${command} ${args}`);
      }
    });
  });
};

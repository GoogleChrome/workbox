const spawn = require('child_process').spawn;

module.exports = (command, args) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {stdio: 'inherit'});
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

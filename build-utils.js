import childProcess from 'child_process';
import path from 'path';
import promisify from 'promisify-node';

export let globPromise = promisify('glob');

/**
 * Wrapper on top of childProcess.spawn() that returns a promise which rejects
 * when the child process has a non-zero exit code and resolves otherwise.
 *
 * @param {String} command The command to spawn.
 * @param {Array.<String>} args The parameters to pass to the command.
 * @returns {Promise} Settles once command completes. Resolves if the exit code
 *                    is 0, and rejects otherwise.
 */
export function processPromiseWrapper(command, args) {
  return new Promise((resolve, reject) => {
    const process = childProcess.spawn(command, args, {stdio: 'inherit'});
    process.on('error', reject);
    process.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Error ${code} returned from ${command} ${args}`);
      }
    });
  });
}

/**
 * Promise.all() rejects immediately as soon as the first Promise rejects.
 * This wrapper will run each Promise to resolution, and if one or more
 * rejected, reject at the end with a concatenated error message.
 *
 * @param {Array.<Promise>} promises The promises to wait on.
 * @returns {Promise.<*>} Resolves with null if all the promises resolve.
 *                        Otherwise, rejects with a concatenated error.
 */
export function promiseAllWrapper(promises) {
  let rejected = [];
  return Promise.all(promises.map(promise => {
    return promise.catch(error => rejected.push(error));
  })).then(() => rejected.length ? Promise.reject(rejected.join('\n')) : null);
}

/**
 * Helper function that runs a task against all projects, or just one of them.
 * It will collect all the results and reject if any of the tasks rejects.
 *
 * @param {Function} task The function to run.
 * @param {String} projectOrStar Either the name of a project, or '*' for all.
 * @param {...Object} [args] Optional additional arguments to pass to task.
 * @returns {Promise.<*>} Resolves with null if all the promises resolve.
 *                        Otherwise, rejects with a concatenated error.
 */
export function taskHarness(task, projectOrStar, ...args) {
  return globPromise(`projects/${projectOrStar}/package.json`)
    .then(projects => promiseAllWrapper(
      projects.map(project => task(path.dirname(project), ...args))
    ));
}

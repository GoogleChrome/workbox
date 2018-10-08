/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * A wrapper that calls readFileFn and returns a promise for the contents of
 * filePath.
 *
 * readFileFn is expected to be set to compiler.inputFileSystem.readFile, to
 * ensure compatibility with webpack dev server's in-memory filesystem.
 *
 * @param {Function} readFileFn The function to use for readFile.
 * @param {string} filePath The path to the file to read.
 * @return {Promise<string>} The contents of the file.
 * @private
 */
function readFileWrapper(readFileFn, filePath) {
  return new Promise((resolve, reject) => {
    readFileFn(filePath, (error, data) => {
      if (error) {
        return reject(error);
      }
      resolve(data);
    });
  });
}

module.exports = readFileWrapper;

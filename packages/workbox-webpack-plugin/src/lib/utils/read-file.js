/**
 * Use the `compiler.inputFileSystem._readFile` method instead of `fs.readFile`,
 * `readFile` is configured to use `compiler.inputFileSystem._readFile` during
 * the run phase of the webpack compilation lifecycle by passing the function
 * to the `setReadFile` function.
 */
let readFileFn;

const setReadFile = (fn) => {
  readFileFn = fn;
};

const readFile = (filePath) => new Promise(
  (resolve, reject) => readFileFn(filePath, 'utf8', (err, data) => {
    if (err) reject(err);
    resolve(data);
  })
);

module.exports = {
  setReadFile,
  readFile,
};

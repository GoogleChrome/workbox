const getFileManifestEntries = require('./get-file-manifest-entries');
const writeFileManifest = require('./utils/write-file-manifest');
const errors = require('./errors');

const generateFileManifest = (input) => {
  if (!input || typeof input !== 'object' || input instanceof Array) {
    return Promise.reject(
      new Error(errors['invalid-generate-file-manifest-arg']));
  }

  const manifestFilePath = input.manifestFilePath;
  const rootDirectory = input.rootDirectory;
  const globPatterns = input.globPatterns;
  const globIgnores = input.globIgnores;

  const fileEntries = getFileManifestEntries({
    rootDirectory, globPatterns, globIgnores,
  });
  return writeFileManifest(manifestFilePath, fileEntries);
};

module.exports = generateFileManifest;

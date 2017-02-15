const getFileDetails = require('./get-file-details');
const filterFiles = require('./filter-files');

module.exports = (globs, globIgnores, rootDirectory) => {
  const fileDetails = globs.reduce((accumulated, globPattern) => {
    const globbedFileDetails = getFileDetails(
      rootDirectory, globPattern, globIgnores);
    return accumulated.concat(globbedFileDetails);
  }, []);

  return filterFiles(fileDetails);
};

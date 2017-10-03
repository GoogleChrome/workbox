module.exports = (maximumFileSizeToCacheInBytes) => {
  return (manifest) => manifest.filter((entry) => {
    return entry.size <= maximumFileSizeToCacheInBytes;
  });
};

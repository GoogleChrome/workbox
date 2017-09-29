const DEFAULT_BUILD_TYPE = 'prod';

module.exports = (source, buildType) => {
  return source.replace(DEFAULT_BUILD_TYPE, buildType);
};

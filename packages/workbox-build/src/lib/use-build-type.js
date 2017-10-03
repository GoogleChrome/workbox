// TODO (jeffposnick): More flexibility in case naming conventions change.
const DEFAULT_BUILD_TYPE = 'prod';

module.exports = (source, buildType) => {
  return source.replace(DEFAULT_BUILD_TYPE, buildType);
};

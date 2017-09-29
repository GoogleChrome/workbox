const _cacheNameDetails = {
  prefix: 'workbox',
  suffix: self.registration.scope,
  precache: 'precache',
  runtime: 'runtime',
};

const _createCacheName = (cacheName) => {
  return [_cacheNameDetails.prefix, cacheName, _cacheNameDetails.suffix]
    .filter((value) => value.length > 0)
    .join('-');
};

export const updateDetails = (details) => {
  Object.keys(_cacheNameDetails).forEach((key) => {
    if (typeof details[key] !== 'undefined') {
      _cacheNameDetails[key] = details[key];
    }
  });
};

export const getPrecacheName = (userCacheName) => {
  return userCacheName || _createCacheName(_cacheNameDetails.precache);
};

export const getRuntimeName = (userCacheName) => {
  return userCacheName || _createCacheName(_cacheNameDetails.runtime);
};

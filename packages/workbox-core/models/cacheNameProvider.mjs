const _cacheNameDetails = {
  prefix: 'workbox',
  suffix: self.registration.scope,
  precache: 'precache',
  runtime: 'runtime',
};

const _createCacheName = (cacheName) => {
  return [_cacheNameDetails.prefix, cacheName, _cacheNameDetails.suffix]
    .join('-');
};

export const updateDetails = (details) => {
  Object.keys(_cacheNameDetails).forEach((key) => {
    _cacheNameDetails[key] = details[key] || _cacheNameDetails[key];
  });
};

export const getPrecacheName = (userCacheName) => {
  return userCacheName || _createCacheName(_cacheNameDetails.precache);
};

export const getRuntimeName = (userCacheName) => {
  return userCacheName || _createCacheName(_cacheNameDetails.runtime);
};

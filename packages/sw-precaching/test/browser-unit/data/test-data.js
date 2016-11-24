const pathPrefix = '/packages/sw-precaching/test/browser-unit/data/files';
const EXAMPLE_REVISIONED_FILES = [
  pathPrefix + '/file-set-1/1.1234.txt',
  pathPrefix + '/file-set-1/2.1234.txt',
  {path: pathPrefix + '/file-set-1/3.txt', revision: '1234'},
  {path: pathPrefix + '/file-set-1/4.txt', revision: '1234'},
];

self.goog = self.goog || {};
self.goog.__TEST_DATA = {
  EXAMPLE_REVISIONED_FILES,
};

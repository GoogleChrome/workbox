import {_private} from 'workbox-core';

export default (userEntries) => {
  const urlOnlyEntries = userEntries.filter(
    (entry) => (typeof entry === 'string' || !entry.revision)
  );

  if (urlOnlyEntries.length === 0) {
    // No warnings needed.
    return;
  }

  let pluralString = `${urlOnlyEntries.length} precache entries`;
  if (urlOnlyEntries.length === 1) {
    pluralString = `1 precache entry`;
  }

  _private.logger.groupCollapsed('Are you precached assets revisioned?');

  _private.logger.debug(
    `workbox-precaching.PrecacheManager.addToCacheList() ` +
    `found ${pluralString} that consist of just a URL meaning we can't ` +
    `confirm it's revisioned.`);
  _private.logger.debug(`For example, these entries are just URLs:`);
  _private.logger.debug(`    /styles/example.css`);
  _private.logger.debug(`    { url: '/index.html' }`);
  _private.logger.debug(`These entries are URLs with revision information:`);
  _private.logger.debug(`    /styles/example.1234.css`);
  _private.logger.debug(`    { url: '/index.html', revision: '123' }`);
  _private.logger.debug(`The following URL's should be checked: `);
  urlOnlyEntries.forEach((urlOnlyEntry) => {
    _private.logger.debug(`    ${JSON.stringify(urlOnlyEntry)}`);
  });
  _private.logger.debug(`*If they aren't revisioned*, you will be unable to ` +
    `update these assets when you publish a new service worker due to how ` +
    `workbox-precaching works.`);
  // TODO Add a useful link
  _private.logger.debug(`Learn more about this message here ....`);

  _private.logger.groupEnd();
};

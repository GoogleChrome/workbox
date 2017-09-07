import {_private} from 'workbox-core';
import core from 'workbox-core';

/**
 * Performs efficient precaching of assets.
 */
export default class PrecacheManager {
  /**
   * Create a new PrecacheManager Instance
   */
  constructor() {
    this._entriesToCacheMap = new Map();
  }

  /**
   * This method will add items to the precache list, removing duplicates
   * and ensuring the information is valie.
   * @param {Array<object|string>} revisionedEntries Array of entries to
   * precache.
   */
  addToCacheList(revisionedEntries) {
    if (process.env.NODE_ENV !== 'prod') {
      core.assert.isArray(revisionedEntries, {
        moduleName: 'workbox-precaching',
        className: 'PrecacheManager',
        funcName: 'addToCacheList',
        paramName: 'revisionedEntries',
      });
    }

    revisionedEntries.map((revisionedEntry) => {
      const newEntry = this._parseEntry(revisionedEntry);

      // Check if the entry is already part of the map
      const previousEntry = this._entriesToCacheMap.get(newEntry.entryId);
      if (previousEntry) {
        if (previousEntry.revision !== newEntry.revision) {
          throw new _private.WorkboxError('duplicate-entries', {
            firstEntry: previousEntry,
            secondEntry: newEntry,
          });
        }
        return;
      }

      // This entry isn't in the install list
      this._entriesToCacheMap.set(newEntry.entryId, newEntry);
    });

    if (process.env.NODE_ENV !== 'prod') {
      const urlOnlyEntries = revisionedEntries.filter(
        (entry) => (typeof entry === 'string' || !entry.revision)
      );

      // TODO Add a way to opt out of this check.
      if (urlOnlyEntries.length > 0) {
        let pluralString = `${urlOnlyEntries.length} precache entries`;
        if (urlOnlyEntries.length === 1) {
          pluralString = `1 precache entry`;
        }

        // TODO Change to group collapsed
        _private.logger.debug(`PrecacheManager.addToCacheList() found ` +
          `${pluralString} that consists of just a URL and no revision ` +
          `information.`);
        _private.logger.debug(`For Example:`);
        _private.logger.debug(`    /styles/example.css`);
        _private.logger.debug(`    /styles/example.1234.css`);
        _private.logger.debug(`  or`);
        _private.logger.debug(`    { url: '/index.html' }`);
        _private.logger.debug(`    { url: '/index.html', revision: '123' }`);
        _private.logger.debug(`The following URL's should be checked: `);
        urlOnlyEntries.forEach((urlOnlyEntry) => {
          _private.logger.debug(`    ${JSON.stringify(urlOnlyEntry)}`);
        });
        _private.logger.debug(`You can disable this message by ....`);
      }
    }
  }

  _parseEntry(input) {
    switch (typeof input) {
      case 'string':
        if (input.length === 0) {
          throw new Error('TODO change to WorkboxError');
        }

        return {
          entryId: input,
          revision: input,
          request: new Request(input),
        };
      case 'object':
        if (!input.url) {
          throw new Error('TODO change to WorkboxError');
        }

        return {
          entryId: input.url,
          revision: input.revision || input.url,
          request: new Request(input.url),
        };
      default:
        throw new Error('TODO: Move to WorkboxError and Add Meaningful Msg');
    }
  }
}

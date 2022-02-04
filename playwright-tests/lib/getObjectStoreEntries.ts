import {IDBPDatabase} from 'idb';
import {Page} from '@playwright/test';

// idb is loaded by the test spec via page.addScriptTag({url: ...})
declare global {
  interface Window {
    idb: {
      openDB: (arg: string) => Promise<IDBPDatabase>;
    };
  }
}

export async function getObjectStoreEntries(
  page: Page,
  dbName: string,
  objectStoreName: string,
): Promise<Array<string>> {
  return await page.evaluate(
    async ([dbName, objectStoreName]): Promise<Array<string>> => {
      const db = await window.idb.openDB(dbName);
      return db.getAll(objectStoreName);
    },
    [dbName, objectStoreName],
  );
}

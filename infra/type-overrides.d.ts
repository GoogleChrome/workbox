// IndexedDB
// ------------------------------------------------------------------------- //

interface IDBIndex {
  openCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest<IDBCursorWithValue | null>;
  openKeyCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest<IDBCursor | null>;
}

interface IDBObjectStore {
  openCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest<IDBCursorWithValue | null>;
  openKeyCursor(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest<IDBCursor | null>;
}

// DOM
// ------------------------------------------------------------------------- //

// Copied from lib.dom.iterable.d.ts for code that doesn't include DOM typings:
// https://github.com/microsoft/TypeScript/blob/00bf32ca3967b07e8663d0cd2b3e2bbf572da88b/lib/lib.dom.iterable.d.ts

interface Headers {
  [Symbol.iterator](): IterableIterator<[string, string]>;
  /**
   * Returns an iterator allowing to go through all key/value pairs contained in this object.
   */
  entries(): IterableIterator<[string, string]>;
  /**
   * Returns an iterator allowing to go through all keys of the key/value pairs contained in this object.
   */
  keys(): IterableIterator<string>;
  /**
   * Returns an iterator allowing to go through all values of the key/value pairs contained in this object.
   */
  values(): IterableIterator<string>;
}

interface URLSearchParams {
  [Symbol.iterator](): IterableIterator<[string, string]>;
  /**
   * Returns an array of key, value pairs for every entry in the search params.
   */
  entries(): IterableIterator<[string, string]>;
  /**
   * Returns a list of keys in the search params.
   */
  keys(): IterableIterator<string>;
  /**
   * Returns a list of values in the search params.
   */
  values(): IterableIterator<string>;
}

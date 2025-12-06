// TODO(philipwalton): remove these once this PR makes its way to a release:
// https://github.com/microsoft/TSJS-lib-generator/pull/701

interface IDBIndex {
  openCursor(
    range?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
  ): IDBRequest<IDBCursorWithValue | null>;
  openKeyCursor(
    range?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
  ): IDBRequest<IDBCursor | null>;
}

interface IDBObjectStore {
  openCursor(
    range?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
  ): IDBRequest<IDBCursorWithValue | null>;
  openKeyCursor(
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
  ): IDBRequest<IDBCursor | null>;
}

// TODO(philipwalton): remove these once this PR makes its way to a release:
// https://github.com/microsoft/TSJS-lib-generator/pull/740

interface CacheStorage {
  match(
    request: RequestInfo,
    options?: MultiCacheQueryOptions,
  ): Promise<Response | undefined>;
}

// TODO(philipwalton): remove these once this bug is fixed:
// https://github.com/microsoft/TypeScript/issues/32435

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

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

// Service Worker
// ------------------------------------------------------------------------- //

interface Clients {
  claim(): Promise<any>;
}

// NOTE(philipwalton): we need to use `WorkerGlobalScope` here because
// TypeScript does not allow us to re-declare self to a different type, and
// currently TypeScript only has a webworker types files (no SW types).
interface WorkerGlobalScope {
  clients: Clients;
  skipWaiting(): void;
}

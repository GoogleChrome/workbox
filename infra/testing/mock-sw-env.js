const makeServiceWorkerEnv = require('service-worker-mock');
const {IDBFactory, IDBKeyRange} = require('shelving-mock-indexeddb');
require('./mock-fetch');

global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;

const swEnv = makeServiceWorkerEnv();

// This is needed to ensure new URL('/', location), works.
swEnv.self.location = 'https://example.com';

// Needed to look like a real SW env
class FakeSWGlobalScope {}
swEnv.ServiceWorkerGlobalScope = FakeSWGlobalScope;

Object.assign(global, swEnv);

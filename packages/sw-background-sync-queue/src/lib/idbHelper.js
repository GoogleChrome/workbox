import IDBHelper from '../../../../lib/idb-helper';

const idbQHelper = new IDBHelper("bgQueueSyncDB",1,"QueueStore");;

export default idbQHelper;
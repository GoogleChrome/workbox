const maxAge = 5*24*60*60*1000; // 5days
const defaultBroadcastChannelName = 'sw-backgroundsync';
const defaultDBName = 'bgQueueSyncDB';
const broadcastMessageAddedType = 'BACKGROUND_REQUESTED_ADDED';
const broadcastMessageFailedType = 'BACKGROUND_REQUESTED_FAILED';
const defaultQueueName = 'DEFAULT_QUEUE';
const tagNamePrefix = 'SW_BACKGROUND_QUEUE_TAG_';
const broadcastMeta = 'SW_BACKGROUND_SYNC_QUEUE';
const allQueuesPlaceholder = 'QUEUES';
export {
	maxAge,
	defaultBroadcastChannelName,
	defaultDBName,
	broadcastMessageAddedType,
	broadcastMessageFailedType,
	defaultQueueName,
	tagNamePrefix,
	broadcastMeta,
	allQueuesPlaceholder,
};

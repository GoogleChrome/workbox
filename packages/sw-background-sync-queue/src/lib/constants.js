const maxAge = 5*24*60*60*1000; // 5days
const defaultBroadcastChannelName = 'sw-backgroundsync';
const defaultDBName = 'bgQueueSyncDB';
const broadcastMessageAddedType = 'BACKGROUND_REQUESTED_ADDED';
const broadcastMessageFailedType = 'BACKGROUND_REQUESTED_FAILED';
const defaultQueueName = 'DEFAULT_QUEUE';
export {
	maxAge,
	defaultBroadcastChannelName,
	defaultDBName,
	broadcastMessageAddedType,
	broadcastMessageFailedType,
	defaultQueueName
};

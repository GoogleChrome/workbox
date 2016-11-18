import {defaultBroadcastChannelName} from './constants';
let bcmanager;

function initiazileBroadcastManager(channelName) {
	bcmanager = new BroadcastChannel(channelName || defaultBroadcastChannelName);
}

function broadcastMessage({type, id, url}) {
	bcmanager && bcmanager.postMessage({
		type: type,
		meta: 'SW_BACKGROUND_SYNC_QUEUE',
		payload: {
			url: url,
		},
	});
}

export {
	initiazileBroadcastManager,
	broadcastMessage,
};

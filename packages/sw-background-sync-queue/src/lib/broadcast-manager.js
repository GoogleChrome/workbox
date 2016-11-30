import {defaultBroadcastChannelName, broadcastMeta} from './constants';
let bcmanager;

function initiazileBroadcastManager(channelName) {
	bcmanager = new BroadcastChannel(channelName || defaultBroadcastChannelName);
}

function broadcastMessage({type, id, url}) {
	bcmanager && bcmanager.postMessage({
		type: type,
		meta: broadcastMeta,
		payload: {
			url: url,
		},
	});
}

export {
	initiazileBroadcastManager,
	broadcastMessage,
};

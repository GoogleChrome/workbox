import {defaultBroadcastChannelName, broadcastMeta} from './constants';
import assert from '../../../../lib/assert';

let bcmanager;

function initiazileBroadcastManager(channelName) {
	bcmanager = new BroadcastChannel(channelName || defaultBroadcastChannelName);
}

function broadcastMessage({type, url}) {
	assert.isType({type}, 'string');
	assert.isType({url}, 'string');

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

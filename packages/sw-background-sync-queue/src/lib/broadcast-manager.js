import {defaultBroadcastChannelName, broadcastMeta} from './constants';
import assert from '../../../../lib/assert';

let bcmanager;

/**
 * initializes the broadcast channel to interact with controlled page
 *
 * @param {String} channelName
 */
function initiazileBroadcastManager(channelName) {
	bcmanager = new BroadcastChannel(channelName || defaultBroadcastChannelName);
}

/**
 * broadcasts the message with the guven type and url
 *
 * @param {Object} config
 */
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

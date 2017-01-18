import {broadcastMeta} from './constants';
import assert from '../../../../lib/assert';

/**
 * broadcasts the message with the given type and url
 *
 * @param {BroadcastChannel} broadcastChannel which is used to push the
 * updates on
 * @param {Object} input
 * @param {string} input.type Type of the message (either success or failure)
 * @param {string} input.url Url for which the request was queued
 * @private
 */
function broadcastMessage({broadcastChannel, type, url}) {
	if(!broadcastChannel)
		return;

	assert.isInstance({broadcastChannel}, BroadcastChannel);
	assert.isType({type}, 'string');
	assert.isType({url}, 'string');

	broadcastChannel.postMessage({
		type: type,
		meta: broadcastMeta,
		payload: {
			url: url,
		},
	});
}

export {
	broadcastMessage,
};

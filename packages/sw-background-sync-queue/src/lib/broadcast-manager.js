import {broadcastMeta} from './constants';
import assert from '../../../../lib/assert';

/**
 * broadcasts the message with the guven type and url
 *
 * @param {Object} config
 * @private
 */
function broadcastMessage(broadcastManager, {type, url}) {
	if(!broadcastManager)
		return;

	assert.isInstance({broadcastManager}, BroadcastChannel);
	assert.isType({type}, 'string');
	assert.isType({url}, 'string');

	broadcastManager.postMessage({
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

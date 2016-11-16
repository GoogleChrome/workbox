import {defaultBroadcastChannelName} from './constants';
let bcmanager;

function initiazileBroadcastManager(channelName){
	bcmanager = new BroadcastChannel(channelName || defaultBroadcastChannelName);
}

function broadcastMessage(message){
	bcmanager && bcmanager.postMessage(message);
}

export {
	initiazileBroadcastManager,
	broadcastMessage
};

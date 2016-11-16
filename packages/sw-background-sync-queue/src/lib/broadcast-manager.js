import {broadcastChannelName} from './constants';

let bcmanager = new BroadcastChannel(broadcastChannelName);
export default bcmanager;

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxEventTarget} from './WorkboxEventTarget.js';
import '../_version.js';

type PropExtractor<WorkboxEventInterface> = Omit<WorkboxEventInterface, "type">;

/**
 * A minimal `Event` subclass shim.
 * This doesn't *actually* subclass `Event` because not all browsers support
 * constructable `EventTarget`, and using a real `Event` will error.
 * @private
 */
export class WorkboxEvent<K extends keyof WorkboxEventMap> {
  target?: WorkboxEventTarget;
  sw: ServiceWorker;

  constructor(public type: K, props: PropExtractor<WorkboxEventMap[K]>) {
    Object.assign(this, props);
  }
}

export interface WorkboxMessageEvent extends WorkboxEvent<"message"> {
  originalEvent: Event;
  data: any;
}

export interface WorkboxLifecycleEvent extends WorkboxEvent<keyof WorkboxLifecycleEventMap> {
  originalEvent?: Event;
  isUpdate?: boolean;
}

export interface WorkboxLifecycleWaitingEvent extends WorkboxLifecycleEvent {
  wasWaitingBeforeRegister?: boolean;
}

export interface WorkboxLifecycleEventMap {
  'installing': WorkboxLifecycleEvent;
  'installed': WorkboxLifecycleEvent;
  'waiting': WorkboxLifecycleWaitingEvent;
  'activating': WorkboxLifecycleEvent;
  'activated': WorkboxLifecycleEvent;
  'controlling': WorkboxLifecycleEvent;
  'externalinstalling': WorkboxLifecycleEvent;
  'externalinstalled': WorkboxLifecycleEvent;
  'externalwaiting': WorkboxLifecycleWaitingEvent;
  'externalactivating': WorkboxLifecycleEvent;
  'externalactivated': WorkboxLifecycleEvent;
}

export interface WorkboxEventMap extends WorkboxLifecycleEventMap {
  'message': WorkboxMessageEvent;
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/


import {WorkboxEventTarget} from './WorkboxEventTarget';
import '../_version';


export interface WorkboxEventProps {
  sw?: ServiceWorker;
  data?: any;
  originalEvent?: Event;
  isUpdate?: boolean;
  wasWaitingBeforeRegister?: boolean;
}

/**
 * A minimal `Event` subclass shim.
 * This doesn't *actually* subclass `Event` because not all browsers support
 * constructable `EventTarget`, and using a real `Event` will error.
 * @private
 */
export class WorkboxEvent {
  target: WorkboxEventTarget;

  constructor(public type: string, props: WorkboxEventProps) {
    Object.assign(this, props);
  }
}

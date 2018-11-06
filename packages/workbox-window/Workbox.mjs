/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from './utils/logger.mjs';
import './_version.mjs';


const urlsMatch = (url1, url2) => {
  return new URL(url1, location).href === new URL(url2, location).href;
}


export class Workbox {
  constructor(scriptUrl, options = {}) {
    this._scriptUrl = scriptUrl;
    this._options = options;

    // this._registration = null;
    // this._sw = null;
    // this._externalSw = null;
    // this._controllingSw = null;
    this._updateFoundCount = 0;

    // A promise that will be resolved once we have a SW reference.
    this._swPromise = new Promise((res) => this._swPromiseResolver = res);

    // A registry of event types to listeners.
    this._eventListenerRegistry = {};

    // Bind event handler callbacks.
    this._onMessage = this._onMessage.bind(this);
    this._onStateChange = this._onStateChange.bind(this);
    this._onUpdateFound = this._onUpdateFound.bind(this);
  }

  async register({immediate = false} = {}) {
    if (process.env.NODE_ENV !== 'production') {
      if (this._registrationTime) {
        logger.error('Cannot re-register a Workbox instance after it has ' +
            'been registered. Create a new instance instead.');
        return;
      }
    }

    if (!immediate && document.readyState !== 'complete') {
      await new Promise((res) => addEventListener('load', res));
    }

    // Create a local reference for better minification/
    let reg;

    try {
      reg = await navigator.serviceWorker.register(
          this._scriptUrl, this._options);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        logger.error(error);
      }
      // Re-throw the error.
      throw error;
    }

    // Determine if there's already an active SW with the same script URL.
    // If there is, set it on the instance in the event that the registration
    // doesn't trigger an update.
    const activeSw = reg.active;
    if (activeSw && urlsMatch(activeSw.scriptURL, this._scriptUrl)) {
      this._sw = activeSw;
      this._swPromiseResolver(activeSw);
    }

    // We set this at registration time rather than instantiation time
    // in the unlikely event that a page creates multiple Workbox instances
    // but staggers their registration.
    this._controllingSw = navigator.serviceWorker.controller;

    // If a SW with the same URL was already controlling the page, let it know
    // the window is ready to receive messages.
    if (this._controllingSw &&
        urlsMatch(this._controllingSw.scriptURL, this._scriptUrl)) {
      this._controllingSw.postMessage({
        type: 'WINDOW_READY',
        meta: 'workbox-window',
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.log('Successfully registered service worker.');

      if (this._controllingSw) {
        if (urlsMatch(this._controllingSw.scriptURL, this._scriptUrl)) {
          logger.debug('A service worker with the same script URL is ' +
              'already controlling this page. This service worker will ' +
              'remain active unless an update is found.');
        } else {
          logger.debug('A service worker with a different script URL is ' +
              'currently controlling the page.');
          logger.debug('Fetching the new script...');
        }
      }

      // If there's an active and waiting service worker before the
      // `updatefound` event fires, it means there was a waiting service worker
      // in the queue before this one was registered.
      if (reg.waiting && reg.active) {
        logger.warn('A service worker was already waiting to activate before ' +
            'this service worker was registered...');
      }

      const currentPageIsOutOfScope = () => {
        const scopeUrl = new URL(
            this._options.scope || this._scriptUrl, document.baseURI);
        const scopeUrlBasePath = new URL('./', scopeUrl.href).pathname;
        return !location.pathname.startsWith(scopeUrlBasePath);
      }
      if (currentPageIsOutOfScope()) {
        logger.warn('The current page is not in scope for the registered ' +
            'service worker. Was this a mistake?');
      }
    }

    reg.addEventListener('updatefound', this._onUpdateFound);

    // Add message listeners.
    if ('BroadcastChannel' in self) {
      this._broadcastChannel = new BroadcastChannel('workbox');
      this._broadcastChannel.addEventListener('message', this._onMessage);
    }
    navigator.serviceWorker.addEventListener('message', this._onMessage);

    // Keep track of when registration happened, so it can be used in the
    // `this._onUpdateFound` heuristic. Also use the presence of this
    // property as a way to see if `.register()` has been called.
    this._registrationTime = performance.now();

    // Expose and return the registration object.
    this._registration = reg;
  }

  async getSw() {
    await this._swPromise;
    return await new Promise((res) => {
      if (this._sw) {
        res(this._sw);
      } else {
        this.addEventListener('installing', (sw) => res(sw));
      }
    });
  }

  async messageSw(data) {
    const sw = await this.getSw();
    return new Promise((resolve) => {
      let messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (evt) => resolve(evt.data);
      sw.postMessage(data, [messageChannel.port2]);
    });
  }

  /**
   * @param {string} type
   * @param {Function} listener
   */
  addEventListener(type, listener) {
    this._getEventListenersByType(type).add(listener);
  }

  /**
   * @param {string} type
   * @param {Function} listener
   */
  removeEventListener(type, listener) {
    this._getEventListenersByType(type).remove(listener);
  }

  /**
   * @param {string} type
   */
  _dispatchEvent(type, arg) {
    this._getEventListenersByType(type).forEach((listener) => listener(arg));
  }

  /**
   * Returns a Set of listeners associated with the passed event type.
   * If no handlers have been registered, an empty Set is returned.
   * @param {string} type The event type.
   * @return {Set} An array of handler functions.
   */
  _getEventListenersByType(type) {
    return this._eventListenerRegistry[type] =
        (this._eventListenerRegistry[type] || new Set());
  }

  /**
   *
   */
  _onUpdateFound() {
    const updatedSw = this._registration.installing;

    // If the script URL passed to `navigator.serviceWorker.register()` is
    // different from the current controlling SW's script URL, we know any
    // successful registration calls will trigger an `updatefound` event.
    // But if the registered script URL is the same as the current controlling
    // SW's script URL, we'll only get an `updatefound` event if the file
    // changed since it was last registered. This can be a problem if the user
    // opens up the same page in a different tab, and that page registers
    // a SW that triggers an update. It's a problem because this page has no
    // good way of knowing whether the `updatefound` event came from the SW
    // script it registered or from a registration attempt made by a newer
    // version of the page running in another tab.
    // To minimize the possibility of a false positive, we use the logic here:
    let updateLikelyTriggeredExternally =
        // Since we enforce only calling `register()` once, and since we don't
        // add the `updatefound` event listener until the `register()` call, if
        // the `updatedSw` property is already set then it means this method
        // has already been called once, so a second call must be external.
        this._updateFoundCount > 0 ||
        // If the script URL registered is different from the script URL of the
        // installing SW, we know it's definitely not from our registration.
        !urlsMatch(updatedSw.scriptURL, this._scriptUrl) ||
        // If the registered script URL and installing SW script URL are the
        // same, then we have to use a heuristic to determine if our
        // registration triggered this update. The heuristic is follows:
        // - If there's currently an active SW with the same script URL,
        // - and if the first `updatefound` event fired more than 1 minute
        //   after the `register()` call,
        // - then assume that `updatefound` event *wasn't* triggered by us.
        (this._sw && performance.now() > this._registrationTime + 60000) ?
        // If any of the above are not true, we assume the update was
        // triggered by this instance.
        true : false;

    if (updateLikelyTriggeredExternally) {
      this._externalSw = updatedSw;
      this._registration.removeEventListener(
          'updatefound', this._onUpdateFound);
    } else {
      // If the update was not triggered externally we know the installing
      // SW is the one we registered, so we set it.
      // NOTE: if there was a controlling SW at registration time with the
      // same script URL, this assignment will override that, but we can still
      // access that SW via the `_controllingSw` property.
      this._sw = updatedSw;
      this._swPromiseResolver(updatedSw);

      // The `installing` state isn't something we have a dedicated
      // callback for, but we do log messages for it in development.
      if (process.env.NODE_ENV !== 'production') {
        if (this._controllingSw) {
          logger.log('Updated service worker found. Installing now...');
        } else {
          logger.log('Service worker is installing...');
        }
      }
    }

    // Increment the `updatefound` count, so future invocations of this
    // method can be sure they were triggered externally.
    ++this._updateFoundCount;

    // Add a `statechange` listener regardless of whether this update was
    // triggered externally, since we have callbacks for both.
    updatedSw.addEventListener('statechange', this._onStateChange);
  }

  /**
   *
   */
  _onStateChange(event) {
    const sw = event.target;
    const {state} = sw;
    const isExternal = sw === this._externalSw;

    const onInstalled = () => {
      if (isExternal) {
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('An external service worker has installed. ' +
              'You may want to suggest users reload this page.');
        }
        this._dispatchEvent('externalInstalled', sw);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          logger.log('Registered service worker installed.');
        }
        this._dispatchEvent('installed', sw);
      }
    }

    const onWaiting = () => {
      if (isExternal) {
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('An external service worker has installed but is ' +
              'waiting for this client to close before activating...');
        }
        this._dispatchEvent('externalWaiting', sw);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('The service worker has installed but is waiting for ' +
              'existing clients to close before activating...');
        }
        this._dispatchEvent('waiting', sw);
      }
    }

    const onActivated = () => {
      if (isExternal) {
        this._dispatchEvent('externalActivated', sw);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          logger.log('Registered service worker activated.');
        }
        this._dispatchEvent('activated', sw);
      }
    }

    const onControlling = () => {
      if (!isExternal) {
        if (process.env.NODE_ENV !== 'production') {
          logger.log('Registered service worker now controlling this page.');
        }
        this._dispatchEvent('controlling', sw);
      }
    }

    const onRedundant = () => {
      if (!isExternal) {
        if (process.env.NODE_ENV !== 'production') {
          logger.log('Registered service worker now redundant!');
        }
        this._dispatchEvent('redundant', sw);
      }
      sw.removeEventListener('statechange', this._onStateChange);
    };

    switch (state) {
      case 'installed':
        onInstalled();

        // This timeout is used to ignore cases where the service worker calls
        // `skipWaiting()` in the install event, thus moving it directly in the
        // activating state. (Since all service workers *must* go through the
        // waiting phase, the only way to detect `skipWaiting()` called in the
        // install event is to observe that the time spent in the waiting phase
        // is very short.)
        // NOTE: we don't need separate timeouts for the new and updated SWs
        // since they can't go through these phases at the same time.
        this._waitingTimeout = setTimeout(() => {
          // Ensure the SW is still waiting (it may now be redundant).
          if (state === 'installed' && this._registration.waiting === sw) {
            onWaiting();
          }
        }, 100);
        break;
      case 'activating':
        this._dispatchEvent('activating', sw);

        clearTimeout(this._waitingTimeout);
        break;
      case 'activated':
        onActivated();
        if (sw === navigator.serviceWorker.controller) {
          onControlling();
        } else {
          if (process.env.NODE_ENV !== 'production') {
            // These conditionals are nested to the minifier can strip out
            // out this entire code block in prod builds.
            if (!isExternal) {
              logger.warn('The registered service worker is active but not ' +
                  'yet controlling the page. Reload or run `clients.claim()` ' +
                  'in the service worker.');
            }
          }
          navigator.serviceWorker.addEventListener(
              'controllerchange', onControlling, {once: true});
        }
        break;
      case 'redundant':
        onRedundant();
        break;
    }
  }

  _onMessage(event) {
    this._dispatchEvent('message', event.data);
  }
}

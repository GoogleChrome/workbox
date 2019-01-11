/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {EventTargetShim} from './utils/EventTargetShim.mjs';
import {logger} from './utils/logger.mjs';
import './_version.mjs';


// The time a SW must be in the waiting phase before we can conclude
// `skipWaiting()` wasn't called. This 200 amount wasn't scientifically
// chosen, but it seems to avoid false positives in my testing.
const WAITING_TIMEOUT_DURATION = 200;

// The amount of time after a registration that we can reasonably conclude
// that the registration didn't trigger an update.
const REGISTRATION_TIMEOUT_DURATION = 60000;

/**
 * Returns true if two URLs have the same `.href` property. The URLS can be
 * relative, and if they are the current location href is used to resolve URLs.
 *
 * @private
 * @param {string} url1
 * @param {string} url2
 * @return {boolean}
 */
const urlsMatch = (url1, url2) => {
  return new URL(url1, location).href === new URL(url2, location).href;
};

/**
 * A class to aid in handling service worker registration, updates, and
 * reacting to service worker lifecycle events.
 */
export class Workbox extends EventTargetShim {
  /**
   * Creates a new Workbox instance with a script URL and service worker
   * options. The script URL and options are the same as those used when
   * calling `navigator.serviceWorker.register(scriptUrl, options)`. See:
   * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
   *
   * @param {string} scriptUrl The service worker script associated with this
   *     instance.
   * @param {Object} [options] The service worker options associated with this
   *     instance.
   */
  constructor(scriptUrl, options = {}) {
    super();

    this._scriptUrl = scriptUrl;
    this._swOptions = options;
    this._updateFoundCount = 0;

    // A promise that will be resolved once we have a SW reference.
    this._swPromise = new Promise((res) => this._swPromiseResolver = res);

    // Instance variables initially not set.
    // this._broadcastChannel;
    // this._controllingSw;
    // this._externalSw;
    // this._registration;
    // this._registrationTime;
    // this._sw;
    // this._waitingTimeout;

    // Bind event handler callbacks.
    this._onMessage = this._onMessage.bind(this);
    this._onStateChange = this._onStateChange.bind(this);
    this._onUpdateFound = this._onUpdateFound.bind(this);
  }

  /**
   * Registers a service worker for this instances script URL and service
   * worker options. By default this method delays registration until after
   * the window has loaded.
   *
   * @param {Object} [options]
   * @param {Function} [options.immediate=false] Setting this to true will
   *     register the service worker immediately, even if the window has
   *     not loaded (not recommended).
   */
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

    // Create a local reference for better minification.
    let reg;

    try {
      reg = await navigator.serviceWorker.register(
          this._scriptUrl, this._swOptions);
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
          logger.debug('The browser is now fetching the new ' +
              'service worker script...');
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
            this._swOptions.scope || this._scriptUrl, document.baseURI);
        const scopeUrlBasePath = new URL('./', scopeUrl.href).pathname;
        return !location.pathname.startsWith(scopeUrlBasePath);
      };
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

    // Expose the registration object.
    this._registration = reg;
  }

  /**
   * Resolves with a reference to a service worker that matches the script URL
   * of this instance, as soon as it’s available.
   *
   * If, at registration time, there’s already an active service worker with a
   * matching script URL, that will be what is resolved. If there’s no active
   * and matching service worker at registration time then the promise will
   * not resolve until an update is found and starts installing, at which
   * point the installing service worker is resolved.
   *
   * @return {Promise<ServiceWorker>}
   */
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

  /**
   * Sends the passed data object to the service worker registered by this
   * instance and resolves with a response (if any).
   *
   * A response can be set in a message handler in the service worker by
   * calling `event.ports[0].postMessage(...)`, which will resolve the promise
   * returned by `messageSw()`. If no response is set, the promise will never
   * resolve.
   *
   * @param {Object} data An object to send to the service worker
   * @return {Promise<Object>}
   */
  async messageSw(data) {
    const sw = await this.getSw();
    return new Promise((resolve) => {
      let messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (evt) => resolve(evt.data);
      sw.postMessage(data, [messageChannel.port2]);
    });
  }

  /**
   * @private
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
        (this._sw && performance.now() >
            this._registrationTime + REGISTRATION_TIMEOUT_DURATION) ?
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
   * @private
   * @param {Event} event
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
    };

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
    };

    const onActivated = () => {
      if (isExternal) {
        this._dispatchEvent('externalActivated', sw);
        if (process.env.NODE_ENV !== 'production') {
          logger.warn('An external service worker has activated.');
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          logger.log('Registered service worker activated.');
        }
        this._dispatchEvent('activated', sw);
      }
    };

    const onControlling = () => {
      if (!isExternal) {
        if (process.env.NODE_ENV !== 'production') {
          logger.log('Registered service worker now controlling this page.');
        }
        this._dispatchEvent('controlling', sw);
      }
    };

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
        }, WAITING_TIMEOUT_DURATION);
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

  /**
   * @private
   * @param {Event} event
   */
  _onMessage(event) {
    this._dispatchEvent('message', event.data);
  }
}

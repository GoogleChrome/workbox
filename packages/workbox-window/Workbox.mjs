/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Deferred} from 'workbox-core/_private/Deferred.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {messageSW} from './messageSW.mjs';
import {EventTargetShim} from './utils/EventTargetShim.mjs';
import {urlsMatch} from './utils/urlsMatch.mjs';
import {WorkboxEvent} from './utils/WorkboxEvent.mjs';
import './_version.mjs';


// The time a SW must be in the waiting phase before we can conclude
// `skipWaiting()` wasn't called. This 200 amount wasn't scientifically
// chosen, but it seems to avoid false positives in my testing.
const WAITING_TIMEOUT_DURATION = 200;

// The amount of time after a registration that we can reasonably conclude
// that the registration didn't trigger an update.
const REGISTRATION_TIMEOUT_DURATION = 60000;

/**
 * A class to aid in handling service worker registration, updates, and
 * reacting to service worker lifecycle events.
 *
 * @memberof module:workbox-window
 */
class Workbox extends EventTargetShim {
  /**
   * Creates a new Workbox instance with a script URL and service worker
   * options. The script URL and options are the same as those used when
   * calling `navigator.serviceWorker.register(scriptURL, options)`. See:
   * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
   *
   * @param {string} scriptURL The service worker script associated with this
   *     instance.
   * @param {Object} [registerOptions] The service worker options associated
   *     with this instance.
   */
  constructor(scriptURL, registerOptions = {}) {
    super();

    this._scriptURL = scriptURL;
    this._registerOptions = registerOptions;
    this._updateFoundCount = 0;

    // Deferreds we can resolve later.
    this._swDeferred = new Deferred();
    this._activeDeferred = new Deferred();
    this._controllingDeferred = new Deferred();

    // Bind event handler callbacks.
    this._onMessage = this._onMessage.bind(this);
    this._onStateChange = this._onStateChange.bind(this);
    this._onUpdateFound = this._onUpdateFound.bind(this);
    this._onControllerChange = this._onControllerChange.bind(this);
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

    // Before registering, attempt to determine if a SW is already controlling
    // the page, and if that SW script (and version, if specified) matches this
    // instance's script.
    this._compatibleControllingSW = this._getControllingSWIfCompatible();

    this._registration = await this._registerScript();

    // Only resolve deferreds now if we know we have a compatible controller.
    if (this._compatibleControllingSW) {
      this._sw = this._compatibleControllingSW;
      this._swDeferred.resolve(this._compatibleControllingSW);
      this._activeDeferred.resolve(this._compatibleControllingSW);
      this._controllingDeferred.resolve(this._compatibleControllingSW);

      this._reportWindowReady(this._compatibleControllingSW);
      this._compatibleControllingSW.addEventListener(
          'statechange', this._onStateChange, {once: true});
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.log('Successfully registered service worker.', this._scriptURL);

      if (navigator.serviceWorker.controller) {
        if (this._compatibleControllingSW) {
          logger.debug('A service worker with the same script URL ' +
              'is already controlling this page.');
        } else {
          logger.debug('A service worker with a different script URL is ' +
              'currently controlling the page. The browser is now fetching ' +
              'the new script now...');
        }
      }

      // If there's an active and waiting service worker before the
      // `updatefound` event fires, it means there was a waiting service worker
      // in the queue before this one was registered.
      if (this._registration.waiting && this._registration.active) {
        logger.warn('A service worker was already waiting to activate ' +
            'before this script was registered...');
      }

      const currentPageIsOutOfScope = () => {
        const scopeURL = new URL(
            this._registerOptions.scope || this._scriptURL, document.baseURI);
        const scopeURLBasePath = new URL('./', scopeURL.href).pathname;
        return !location.pathname.startsWith(scopeURLBasePath);
      };
      if (currentPageIsOutOfScope()) {
        logger.warn('The current page is not in scope for the registered ' +
            'service worker. Was this a mistake?');
      }
    }

    this._registration.addEventListener('updatefound', this._onUpdateFound);
    navigator.serviceWorker.addEventListener(
        'controllerchange', this._onControllerChange, {once: true});

    // Add message listeners.
    if ('BroadcastChannel' in self) {
      this._broadcastChannel = new BroadcastChannel('workbox');
      this._broadcastChannel.addEventListener('message', this._onMessage);
    }
    navigator.serviceWorker.addEventListener('message', this._onMessage);

    return this._registration;
  }

  /**
   * Resolves to the service worker registered by this instance as soon as it
   * is active. If a service worker was already controlling at registration
   * time then it will resolve to that if the script URLs (and optionally
   * script versions) match, otherwise it will wait until an update is found
   * and activates.
   *
   * @return {Promise<ServiceWorker>}
   */
  get active() {
    return this._activeDeferred.promise;
  }

  /**
   * Resolves to the service worker registered by this instance as soon as it
   * is controlling the page. If a service worker was already controlling at
   * registration time then it will resolve to that if the script URLs (and
   * optionally script versions) match, otherwise it will wait until an update
   * is found and starts controlling the page.
   * Note: the first time a service worker is installed it will active but
   * not start controlling the page unless `clients.claim()` is called in the
   * service worker.
   *
   * @return {Promise<ServiceWorker>}
   */
  get controlling() {
    return this._controllingDeferred.promise;
  }

  /**
   * Resolves with a reference to a service worker that matches the script URL
   * of this instance, as soon as it's available.
   *
   * If, at registration time, there’s already an active service worker with a
   * matching script URL, that will be what is resolved. If there’s no active
   * and matching service worker at registration time then the promise will
   * not resolve until an update is found and starts installing, at which
   * point the installing service worker is resolved.
   *
   * @return {Promise<ServiceWorker>}
   */
  async getSW() {
    return this._swDeferred.promise;
  }

  /**
   * Sends the passed data object to the service worker registered by this
   * instance and resolves with a response (if any).
   *
   * A response can be set in a message handler in the service worker by
   * calling `event.ports[0].postMessage(...)`, which will resolve the promise
   * returned by `messageSW()`. If no response is set, the promise will never
   * resolve.
   *
   * @param {Object} data An object to send to the service worker
   * @return {Promise<Object>}
   */
  async messageSW(data) {
    const sw = await this.getSW();
    return new Promise((resolve) => {
      let messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (evt) => resolve(evt.data);
      sw.postMessage(data, [messageChannel.port2]);
    });
  }

  /**
   * Checks for a service worker already controlling the page and returns
   * it if its script URL (and optionally script version) match. The
   * script version is determined by sending a message to the controlling
   * service worker and waiting for a response. If no response is returned
   * the service worker is assumed to not have a version.
   *
   * @private
   * @return {ServiceWorker|undefined}
   */
  _getControllingSWIfCompatible() {
    const controller = navigator.serviceWorker.controller;

    if (controller && urlsMatch(controller.scriptURL, this._scriptURL)) {
      // If the URLs match and no script version is specified, assume the
      // SW is the same. NOTE: without a script version, this isn't a
      // particularly good test. Using a script version is encouraged if
      // you need to send messages to your service worker on all page loads.
      return controller;
    }
  }

  /**
   * Registers a service worker for this instances script URL and register
   * options and tracks the time registration was complete.
   *
   * @private
   */
  async _registerScript() {
    try {
      const reg = await navigator.serviceWorker.register(
          this._scriptURL, this._registerOptions);

      // Keep track of when registration happened, so it can be used in the
      // `this._onUpdateFound` heuristic. Also use the presence of this
      // property as a way to see if `.register()` has been called.
      this._registrationTime = performance.now();

      return reg;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        logger.error(error);
      }
      // Re-throw the error.
      throw error;
    }
  }


  /**
   * Sends a message to the passed service worker that the window is ready.
   *
   * @param {ServiceWorker} sw
   * @private
   */
  _reportWindowReady(sw) {
    messageSW(sw, {
      type: 'WINDOW_READY',
      meta: 'workbox-window',
    });
  }

  /**
   * @private
   */
  _onUpdateFound() {
    const installingSW = this._registration.installing;

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
        // `_updateFoundCount` is > 0 then it means this method has already
        // been called, thus this SW must be external
        this._updateFoundCount > 0 ||
        // If the script URL of the installing SW is different from this
        // instance's script URL, we know it's definitely not from our
        // registration.
        !urlsMatch(installingSW.scriptURL, this._scriptURL) ||
        // If all of the above are false, then we use a time-based heuristic:
        // Any `updatefound` event that occurs long after our registration is
        // assumed to be external.
        (performance.now() >
            this._registrationTime + REGISTRATION_TIMEOUT_DURATION) ?
                // If any of the above are not true, we assume the update was
                // triggered by this instance.
                true : false;

    if (updateLikelyTriggeredExternally) {
      this._externalSW = installingSW;
      this._registration.removeEventListener(
          'updatefound', this._onUpdateFound);
    } else {
      // If the update was not triggered externally we know the installing
      // SW is the one we registered, so we set it.
      this._sw = installingSW;
      this._swDeferred.resolve(installingSW);

      // The `installing` state isn't something we have a dedicated
      // callback for, but we do log messages for it in development.
      if (process.env.NODE_ENV !== 'production') {
        if (navigator.serviceWorker.controller) {
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
    installingSW.addEventListener('statechange', this._onStateChange);
  }

  /**
   * @private
   * @param {Event} originalEvent
   */
  _onStateChange(originalEvent) {
    const sw = originalEvent.target;
    const {state} = sw;
    const isExternal = sw === this._externalSW;
    const eventPrefix = isExternal ? 'external' : '';

    this.dispatchEvent(new WorkboxEvent(
        eventPrefix + state, {sw, originalEvent}));

    if (state === 'installed') {
      // This timeout is used to ignore cases where the service worker calls
      // `skipWaiting()` in the install event, thus moving it directly in the
      // activating state. (Since all service workers *must* go through the
      // waiting phase, the only way to detect `skipWaiting()` called in the
      // install event is to observe that the time spent in the waiting phase
      // is very short.)
      // NOTE: we don't need separate timeouts for the own and external SWs
      // since they can't go through these phases at the same time.
      this._waitingTimeout = setTimeout(() => {
        // Ensure the SW is still waiting (it may now be redundant).
        if (state === 'installed' && this._registration.waiting === sw) {
          this.dispatchEvent(new WorkboxEvent(
              eventPrefix + 'waiting', {sw, originalEvent}));

          if (process.env.NODE_ENV !== 'production') {
            if (isExternal) {
              logger.warn('An external service worker has installed but is ' +
                  'waiting for this client to close before activating...');
            } else {
              logger.warn('The service worker has installed but is waiting ' +
                  ' for existing clients to close before activating...');
            }
          }
        }
      }, WAITING_TIMEOUT_DURATION);
    } else if (state === 'activating') {
      clearTimeout(this._waitingTimeout);
      if (!isExternal) {
        this._activeDeferred.resolve(sw);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      switch (state) {
        case 'installed':
          if (isExternal) {
            logger.warn('An external service worker has installed. ' +
                'You may want to suggest users reload this page.');
          } else {
            logger.log('Registered service worker installed.');
          }
          break;
        case 'activated':
          if (isExternal) {
            logger.warn('An external service worker has activated.');
          } else {
            logger.log('Registered service worker activated.');
            if (sw !== navigator.serviceWorker.controller) {
              logger.warn('The registered service worker is active but ' +
                  'not yet controlling the page. Reload or run ' +
                  '`clients.claim()` in the service worker.');
            }
          }
          break;
        case 'redundant':
          if (!isExternal) {
            logger.log('Registered service worker now redundant!');
          }
          break;
      }
    }
  }

  /**
   * @private
   * @param {Event} originalEvent
   */
  _onControllerChange(originalEvent) {
    const sw = this._sw;
    if (sw === navigator.serviceWorker.controller) {
      if (process.env.NODE_ENV !== 'production') {
        logger.log('Registered service worker now controlling this page.');
      }
      this.dispatchEvent(new WorkboxEvent('controlling', {sw, originalEvent}));
      this._controllingDeferred.resolve(sw);
    }
  }

  /**
   * @private
   * @param {Event} originalEvent
   */
  _onMessage(originalEvent) {
    const {data} = originalEvent;
    this.dispatchEvent(new WorkboxEvent('message', {data, originalEvent}));
  }
}

export {Workbox};

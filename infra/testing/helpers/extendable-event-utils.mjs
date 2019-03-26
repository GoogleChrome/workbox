/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/


const extendLifetimePromises = new WeakMap();

export const eventDoneWaiting = async (event) => {
  const promises = extendLifetimePromises.get(event);
  let promise;

  while (promise = promises.shift()) {
    // Ignore errors.
    await promise.catch((e) => e);
  }
};

export const watchEvent = (event) => {
  const promises = [];
  extendLifetimePromises.set(event, promises);

  event.waitUntil = (promise) => {
    promises.push(promise);
  };

  if (event instanceof FetchEvent) {
    event.respondWith = (responseOrPromise) => {
      promises.push(Promise.resolve(responseOrPromise));

      // TODO(philipwalton): we cannot currently call the native
      // `respondWith()` due to this bug in Firefix:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1538756
      // FetchEvent.prototype.respondWith.call(event, responseOrPromise);
    };
  }
};

export const dispatchAndWaitUntilDone = async (event) => {
  watchEvent(event);
  self.dispatchEvent(event);
  await eventDoneWaiting(event);
};

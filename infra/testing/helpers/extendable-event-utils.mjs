/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const extendLifetimePromises = new WeakMap();
const eventResponses = new WeakMap();

export const eventDoneWaiting = async (event, {catchErrors = true} = {}) => {
  const promises = extendLifetimePromises.get(event);
  let promise;

  while ((promise = promises.shift())) {
    // Ignore errors by default;
    if (catchErrors) {
      promise = promise.catch((e) => e);
    }
    await promise;
  }
};

export const spyOnEvent = (event) => {
  const promises = [];
  extendLifetimePromises.set(event, promises);

  event.waitUntil = sinon.stub().callsFake((promise) => {
    promises.push(promise);
  });

  if (event instanceof FetchEvent) {
    event.respondWith = sinon.stub().callsFake((responseOrPromise) => {
      const promise = Promise.resolve(responseOrPromise);

      eventResponses.set(event, promise);
      promises.push(promise);

      // TODO(philipwalton): we cannot currently call the native
      // `respondWith()` due to this bug in Firefox:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1538756
      // FetchEvent.prototype.respondWith.call(event, responseOrPromise);
    });
  }
};

export const dispatchAndWaitUntilDone = async (event) => {
  spyOnEvent(event);
  self.dispatchEvent(event);
  await eventDoneWaiting(event);
};

export const dispatchAndWaitForResponse = async (event) => {
  await dispatchAndWaitUntilDone(event);
  const response = await eventResponses.get(event);
  return response;
};

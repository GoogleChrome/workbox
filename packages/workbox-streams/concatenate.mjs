/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {assert} from 'workbox-core/_private/assert.mjs';

import './_version.mjs';

/**
 * Takes either a Response, a ReadableStream, or a
 * [BodyInit](https://fetch.spec.whatwg.org/#bodyinit) and returns the
 * ReadableStreamReader object associated with it.
 *
 * @param {workbox.streams.StreamSource} source
 * @return {ReadableStreamReader}
 * @private
 */
function _getReaderFromSource(source) {
  if (source.body && source.body.getReader) {
    return source.body.getReader();
  }

  if (source.getReader) {
    return source.getReader();
  }

  // TODO: This should be possible to do by constructing a ReadableStream, but
  // I can't get it to work. As a hack, construct a new Response, and use the
  // reader associated with its body.
  return new Response(source).body.getReader();
}

/**
 * Takes multiple source Promises, each of which could resolve to a Response, a
 * ReadableStream, or a [BodyInit](https://fetch.spec.whatwg.org/#bodyinit).
 *
 * Returns an object exposing a ReadableStream with each individual stream's
 * data returned in sequence, along with a Promise which signals when the
 * stream is finished (useful for passing to a FetchEvent's waitUntil()).
 *
 * @param {Array<Promise<workbox.streams.StreamSource>>} sourcePromises
 * @return {Object<{done: Promise, stream: ReadableStream}>}
 *
 * @memberof workbox.streams
 */
function concatenate(sourcePromises) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isArray(sourcePromises, {
      moduleName: 'workbox-streams',
      funcName: 'concatenate',
      paramName: 'sourcePromises',
    });
  }

  const readerPromises = sourcePromises.map((sourcePromise) => {
    return Promise.resolve(sourcePromise).then((source) => {
      return _getReaderFromSource(source);
    });
  });

  let fullyStreamedResolve;
  let fullyStreamedReject;
  const done = new Promise((resolve, reject) => {
    fullyStreamedResolve = resolve;
    fullyStreamedReject = reject;
  });

  let i = 0;
  const logMessages = [];
  const stream = new ReadableStream({
    pull(controller) {
      return readerPromises[i]
          .then((reader) => reader.read())
          .then((result) => {
            if (result.done) {
              if (process.env.NODE_ENV !== 'production') {
                logMessages.push(['Reached the end of source:',
                  sourcePromises[i]]);
              }

              i++;
              if (i >= readerPromises.length) {
              // Log all the messages in the group at once in a single group.
                if (process.env.NODE_ENV !== 'production') {
                  logger.groupCollapsed(
                      `Concatenating ${readerPromises.length} sources.`);
                  for (const message of logMessages) {
                    if (Array.isArray(message)) {
                      logger.log(...message);
                    } else {
                      logger.log(message);
                    }
                  }
                  logger.log('Finished reading all sources.');
                  logger.groupEnd();
                }

                controller.close();
                fullyStreamedResolve();
                return;
              }

              return this.pull(controller);
            } else {
              controller.enqueue(result.value);
            }
          }).catch((error) => {
            if (process.env.NODE_ENV !== 'production') {
              logger.error('An error occurred:', error);
            }
            fullyStreamedReject(error);
            throw error;
          });
    },

    cancel() {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('The ReadableStream was cancelled.');
      }

      fullyStreamedResolve();
    },
  });

  return {done, stream};
}

export {concatenate};

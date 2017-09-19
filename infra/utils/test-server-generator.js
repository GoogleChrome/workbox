/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/**
 * README:
 * This test server is used in unit tests as well as
 * by the 'gulp serve' task, so please make sure
 * changes here work in all scenarios.
 *
 * There are two servers so tests can make requests to a foreign origin.
 */

/* eslint-disable valid-jsdoc */

const ServerInstance = require('./server-instance');

const getNewServerInstance = () => {
  let primaryServer;
  let secondaryServer;

  return {
    /**
     * Calling start will create two servers. The primary port will be returned
     * and the secondary server will be on the primary port + 1;
     */
    start: (rootDirectory, port) => {
      if (primaryServer || secondaryServer) {
        return Promise.reject('Server already running');
      }

      if (!port) {
        port = 3004;
      }

      primaryServer = new ServerInstance();
      secondaryServer = new ServerInstance();

      return primaryServer.start(rootDirectory, port)
      .then((primaryPort) => {
        let secondaryPort = primaryPort + 1;
        return secondaryServer.start(rootDirectory, secondaryPort)
        .then((actualSecondaryPort) => {
          if (actualSecondaryPort !== secondaryPort) {
            return Promise.all([
              primaryServer.stop(),
              secondaryServer.stop(),
            ])
            .then(() => {
              Promise.reject(new Error('Server could not get the required ' +
                'ports or primaryPort and primaryPort + 1.'));
            });
          } else {
            return primaryPort;
          }
        });
      });
    },
    stop: () => {
      return Promise.all([
        primaryServer.stop(),
        secondaryServer.stop(),
      ])
      .then(() => {
        primaryServer = null;
        secondaryServer = null;
      });
    },
  };
};

module.exports = getNewServerInstance;

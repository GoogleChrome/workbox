/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const upath = require('upath');

const {
  constants,
} = require('../../../packages/workbox-cli/build/lib/constants');
const {errors} = require('../../../packages/workbox-cli/build/lib/errors');
const {
  WorkboxConfigError,
} = require('../../../packages/workbox-build/build/lib/validate-options');

chai.use(chaiAsPromised);
const {expect} = chai;

describe(`[workbox-cli] app.js`, function () {
  const MODULE_PATH = '../../../packages/workbox-cli/build/app';
  const PROXIED_CONFIG_FILE = upath.resolve(process.cwd(), '/will/be/proxied');
  const PROXIED_DEST_DIR = upath.resolve(process.cwd(), 'build');
  const PROXIED_ERROR = new Error('proxied error message');
  const PROXIED_CONFIG = {
    globDirectory: '.',
    swDest: 'sw.js',
  };
  const INVALID_CONFIG_FILE = upath.resolve(
    process.cwd(),
    upath.join('does', 'not', 'exist'),
  );
  const UNKNOWN_COMMAND = 'unknown-command';
  const WORKBOX_BUILD_COMMANDS = ['generateSW', 'injectManifest'];
  const WORKBOX_BUILD_NO_WARNINGS_RETURN_VALUE = {
    count: 1,
    filePaths: ['ignored1', 'ignored2'],
    size: 2,
    warnings: [],
  };
  const WORKBOX_BUILD_WITH_WARNINGS_RETURN_VALUE = {
    count: 1,
    filePaths: ['ignored'],
    size: 2,
    warnings: ['warning'],
  };

  describe(`failures due to bad parameters`, function () {
    const {app} = require(MODULE_PATH);

    it(`should reject when both parameters are missing`, async function () {
      await expect(app()).to.eventually.be.rejectedWith(
        errors['missing-input'],
      );
    });

    it(`should reject when the command is unknown and options is present`, async function () {
      await expect(
        app({input: [UNKNOWN_COMMAND, PROXIED_CONFIG_FILE]}),
      ).to.eventually.be.rejectedWith(errors['unknown-command']);
    });

    it(`should reject when the command parameter is copyLibraries and options is missing`, async function () {
      await expect(
        app({input: ['copyLibraries']}),
      ).to.eventually.be.rejectedWith(errors['missing-dest-dir-param']);
    });

    for (const command of WORKBOX_BUILD_COMMANDS) {
      it(`should reject when the command parameter is ${command} and options does not exist`, async function () {
        const loggerErrorStub = sinon.stub();
        const {app} = proxyquire(MODULE_PATH, {
          './lib/logger.js': {
            logger: {error: loggerErrorStub},
          },
        });

        try {
          await app({input: [command, INVALID_CONFIG_FILE]});
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(loggerErrorStub.calledOnce).to.be.true;
          expect(
            loggerErrorStub.alwaysCalledWithExactly(
              errors['invalid-common-js-module'],
            ),
          ).to.be.true;

          expect(error.message).to.have.string(INVALID_CONFIG_FILE);
        }
      });
    }
  });

  describe(`failures due to workbox-build runtime errors`, function () {
    for (const command of WORKBOX_BUILD_COMMANDS) {
      // TODO: Expand this list.
      const badConfigs = [
        {},
        {swDest: null},
        {globPatterns: null, swDest: '/path/to/sw.js'},
        {foo: 'bar'},
      ];

      for (const config of badConfigs) {
        it(`should reject with a WorkboxConfigError when workbox-build.${command}(${JSON.stringify(
          config,
        )}) is called`, async function () {
          const {app} = proxyquire(MODULE_PATH, {
            './lib/logger': {
              logger: {
                error: sinon.stub(),
                log: sinon.stub(),
              },
            },
            './lib/read-config': {
              readConfig: (options) => {
                expect(options).to.eql(PROXIED_CONFIG_FILE);
                return config;
              },
            },
          });

          await expect(
            app({input: [command, PROXIED_CONFIG_FILE]}),
          ).to.eventually.be.rejectedWith(WorkboxConfigError);
        });
      }

      it(`should reject with a generic runtime error when the workbox-build.${command}() rejects for any other reason`, async function () {
        const {app} = proxyquire(MODULE_PATH, {
          './lib/logger': {
            logger: {
              log: sinon.stub(),
            },
          },
          './lib/read-config': {
            readConfig: (options) => {
              expect(options).to.eql(PROXIED_CONFIG_FILE);
              return PROXIED_CONFIG;
            },
          },
          'workbox-build': {
            [command]: (config) => {
              expect(config).to.eql(PROXIED_CONFIG);
              throw PROXIED_ERROR;
            },
          },
        });

        await expect(
          app({input: [command, PROXIED_CONFIG_FILE]}),
        ).to.eventually.be.rejectedWith(PROXIED_ERROR);
      });
    }
  });

  describe(`successful calls`, function () {
    for (const command of WORKBOX_BUILD_COMMANDS) {
      it(`should call logger.log() upon successfully running workbox-build.${command}()`, async function () {
        const loggerLogStub = sinon.stub();
        const {app} = proxyquire(MODULE_PATH, {
          './lib/read-config': {
            readConfig: (options) => {
              expect(options).to.eql(PROXIED_CONFIG_FILE);
              return PROXIED_CONFIG;
            },
          },
          './lib/logger': {
            logger: {
              log: loggerLogStub,
            },
          },
          'workbox-build': {
            [command]: () => {
              return WORKBOX_BUILD_NO_WARNINGS_RETURN_VALUE;
            },
          },
        });

        await app({input: [command, PROXIED_CONFIG_FILE]});
        expect(loggerLogStub.callCount).to.eql(3);
      });

      it(`should call logger.warn() to report warnings, and then logger.log() upon successfully running workbox-build.${command}()`, async function () {
        const loggerLogStub = sinon.stub();
        const loggerWarningStub = sinon.stub();
        const {app} = proxyquire(MODULE_PATH, {
          './lib/read-config': {
            readConfig: (options) => {
              expect(options).to.eql(PROXIED_CONFIG_FILE);
              return PROXIED_CONFIG;
            },
          },
          './lib/logger': {
            logger: {
              log: loggerLogStub,
              warn: loggerWarningStub,
            },
          },
          'workbox-build': {
            [command]: () => {
              return WORKBOX_BUILD_WITH_WARNINGS_RETURN_VALUE;
            },
          },
        });

        await app({input: [command, PROXIED_CONFIG_FILE]});
        expect(loggerWarningStub.calledOnce).to.be.true;
        expect(loggerLogStub.callCount).to.eql(3);
      });

      it(`should call logger.log() upon successfully running workbox-build.${command}() using the default config file location`, async function () {
        const loggerLogStub = sinon.stub();
        const {app} = proxyquire(MODULE_PATH, {
          './lib/read-config': {
            readConfig: (options) => {
              const defaultConfigPath = upath.join(
                process.cwd(),
                constants.defaultConfigFile,
              );
              expect(options).to.eql(defaultConfigPath);
              return PROXIED_CONFIG;
            },
          },
          './lib/logger': {
            logger: {
              log: loggerLogStub,
              error: loggerLogStub,
            },
          },
          'workbox-build': {
            [command]: () => {
              return WORKBOX_BUILD_NO_WARNINGS_RETURN_VALUE;
            },
          },
        });

        await app({input: [command]});
        expect(loggerLogStub.callCount).to.eql(3);
      });
    }

    it(`should call logger.log() upon successfully running workbox-build.copyWorkboxLibraries()`, async function () {
      const loggerLogStub = sinon.stub();
      const {app} = proxyquire(MODULE_PATH, {
        './lib/logger': {
          logger: {
            log: loggerLogStub,
          },
        },
        'workbox-build': {
          copyWorkboxLibraries: (destDir) => {
            expect(destDir).to.eql(PROXIED_DEST_DIR);
            return upath.join(destDir, 'workbox');
          },
        },
      });

      await app({input: ['copyLibraries', PROXIED_DEST_DIR]});
      expect(loggerLogStub.callCount).to.eql(3);
    });

    it(`should call params.showHelp() when passed 'help'`, async function () {
      const {app} = require(MODULE_PATH);

      const params = {
        input: ['help'],
        showHelp: sinon.stub(),
      };

      await app(params);
      expect(params.showHelp.calledOnce).to.be.true;
    });

    it(`should call params.showHelp() when not passed any command`, async function () {
      const {app} = require(MODULE_PATH);

      const params = {
        input: [],
        showHelp: sinon.stub(),
      };

      await app(params);
      expect(params.showHelp.calledOnce).to.be.true;
    });
  });
});

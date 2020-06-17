"use strict";
/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const assert = require("assert");
const common_tags_1 = require("common-tags");
const upath = require("upath");
const prettyBytes = require("pretty-bytes");
const watch = require("glob-watcher");
const workboxBuild = require("workbox-build");
const constants_js_1 = require("./lib/constants.js");
const errors_js_1 = require("./lib/errors.js");
const logger_js_1 = require("./lib/logger.js");
const read_config_js_1 = require("./lib/read-config.js");
const run_wizard_js_1 = require("./lib/run-wizard.js");
/**
 * Runs the specified build command with the provided configuration.
 *
 * @param {Object} options
 */
function runBuildCommand({ command, config, watch }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { count, filePaths, size, warnings } = yield workboxBuild[command](config);
            for (const warning of warnings) {
                logger_js_1.logger.warn(warning);
            }
            if (filePaths.length === 1) {
                logger_js_1.logger.log(`The service worker file was written to ${config.swDest}`);
            }
            else {
                const message = filePaths
                    .sort()
                    .map((filePath) => `  • ${filePath}`)
                    .join(`\n`);
                logger_js_1.logger.log(`The service worker files were written to:\n${message}`);
            }
            logger_js_1.logger.log(`The service worker will precache ${count} URLs, ` +
                `totaling ${prettyBytes(size)}.`);
            if (watch) {
                logger_js_1.logger.log(`\nWatching for changes...`);
            }
        }
        catch (error) {
            // See https://github.com/hapijs/joi/blob/v11.3.4/API.md#errors
            if (typeof error.annotate === 'function') {
                throw new Error(`${errors_js_1.errors['config-validation-failed']}\n${error.annotate()}`);
            }
            logger_js_1.logger.error(errors_js_1.errors['workbox-build-runtime-error']);
            throw error;
        }
    });
}
exports.app = (params) => __awaiter(void 0, void 0, void 0, function* () {
    // This should not be a user-visible error, unless meow() messes something up.
    assert(Array.isArray(params.input), errors_js_1.errors['missing-input']);
    // Default to showing the help message if there's no command provided.
    const [command = 'help', option] = params.input;
    switch (command) {
        case 'wizard': {
            yield run_wizard_js_1.runWizard(params.flags);
            break;
        }
        case 'copyLibraries': {
            assert(option, errors_js_1.errors['missing-dest-dir-param']);
            const parentDirectory = upath.resolve(process.cwd(), option);
            const dirName = yield workboxBuild.copyWorkboxLibraries(parentDirectory);
            const fullPath = upath.join(parentDirectory, dirName);
            logger_js_1.logger.log(`The Workbox libraries were copied to ${fullPath}`);
            logger_js_1.logger.log(common_tags_1.oneLine `Add a call to workbox.setConfig({modulePathPrefix: '...'})
        to your service worker to use these local libraries.`);
            logger_js_1.logger.log(`See https://goo.gl/Fo9gPX for further documentation.`);
            break;
        }
        case 'generateSW':
        case 'injectManifest': {
            const configPath = upath.resolve(process.cwd(), option || constants_js_1.constants.defaultConfigFile);
            let config;
            try {
                config = read_config_js_1.readConfig(configPath);
            }
            catch (error) {
                logger_js_1.logger.error(errors_js_1.errors['invalid-common-js-module']);
                throw error;
            }
            logger_js_1.logger.log(`Using configuration from ${configPath}.`);
            // Determine whether we're in --watch mode, or one-off mode.
            if (params.flags && params.flags.watch) {
                const options = { ignoreInitial: false };
                if (config.globIgnores) {
                    options.ignored = config.globIgnores;
                }
                if (config.globDirectory) {
                    options.cwd = config.globDirectory;
                }
                if (config.globPatterns) {
                    watch(config.globPatterns, options, () => runBuildCommand({ command, config, watch: true }));
                }
            }
            else {
                yield runBuildCommand({ command, config, watch: false });
            }
            break;
        }
        case 'help': {
            params.showHelp();
            break;
        }
        default: {
            throw new Error(errors_js_1.errors['unknown-command'] + ` ` + command);
        }
    }
});

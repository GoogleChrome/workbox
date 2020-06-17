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
exports.askExtensionsToCache = void 0;
const assert = require("assert");
const inquirer_1 = require("inquirer");
const glob = require("glob");
const ora = require("ora");
const upath = require("upath");
const errors_1 = require("../errors");
const constants_1 = require("../constants");
// The key used for the question/answer.
const name = 'globPatterns';
/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<Array<string>>} The unique file extensions corresponding
 * to all of the files under globDirectory.
 */
function getAllFileExtensions(globDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield new Promise((resolve, reject) => {
            // Use a pattern to match any file that contains a '.', since that signifies
            // the presence of a file extension.
            glob('**/*.*', {
                cwd: globDirectory,
                nodir: true,
                ignore: [
                    ...constants_1.constants.ignoredDirectories.map((directory) => `**/${directory}/**`),
                    ...constants_1.constants.ignoredFileExtensions.map((extension) => `**/*.${extension}`),
                ],
            }, (error, files) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(files);
                }
            });
        });
        const extensions = new Set();
        for (const file of files) {
            const extension = upath.extname(file);
            if (extension) {
                // Get rid of the leading . character.
                extensions.add(extension.replace(/^\./, ''));
            }
        }
        return [...extensions];
    });
}
/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<Object>} The answers from inquirer.
 */
function askQuestion(globDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        // We need to get a list of extensions corresponding to files in the directory
        // to use when asking the next question. That could potentially take some
        // time, so we show a spinner and explanatory text.
        const spinner = ora({
            text: `Examining files in ${globDirectory}...`,
            stream: process.stdout,
        }).start();
        const fileExtensions = yield getAllFileExtensions(globDirectory);
        spinner.stop();
        assert(fileExtensions.length > 0, errors_1.errors['no-file-extensions-found']);
        return inquirer_1.prompt([{
                name,
                message: 'Which file types would you like to precache?',
                type: 'checkbox',
                choices: fileExtensions,
                default: fileExtensions,
            }]);
    });
}
function askExtensionsToCache(globDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        const answers = yield askQuestion(globDirectory);
        const extensions = answers[name];
        assert(extensions.length > 0, errors_1.errors['no-file-extensions-selected']);
        // glob isn't happy with a single option inside of a {} group, so use a
        // pattern without a {} group when there's only one extension.
        const extensionsPattern = extensions.length === 1 ?
            extensions[0] :
            `{${extensions.join(',')}}`;
        return [`**/*.${extensionsPattern}`];
    });
}
exports.askExtensionsToCache = askExtensionsToCache;
;

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
exports.askRootOfWebApp = void 0;
const assert = require("assert");
const fse = require("fs-extra");
const glob = require("glob");
const inquirer_1 = require("inquirer");
const common_tags_1 = require("common-tags");
const errors_1 = require("../errors");
const constants_1 = require("../constants");
const ROOT_PROMPT = 'Please enter the path to the root of your web app:';
// The key used for the question/answer.
const name = 'globDirectory';
/**
 * @return {Promise<Array<string>>} The subdirectories of the current
 * working directory, with hidden and ignored ones filtered out.
 */
function getSubdirectories() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve, reject) => {
            glob('*/', {
                ignore: constants_1.constants.ignoredDirectories.map((directory) => `${directory}/`),
            }, (error, directories) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(directories);
                }
            });
        });
    });
}
/**
 * @return {Promise<Object>} The answers from inquirer.
 */
function askQuestion() {
    return __awaiter(this, void 0, void 0, function* () {
        const subdirectories = yield getSubdirectories();
        if (subdirectories.length > 0) {
            const manualEntryChoice = 'Manually enter path';
            return inquirer_1.prompt([{
                    name,
                    type: 'list',
                    message: common_tags_1.oneLine `What is the root of your web app (i.e. which directory do
        you deploy)?`,
                    choices: subdirectories.concat([
                        new inquirer_1.Separator().toString(),
                        manualEntryChoice,
                    ]),
                }, {
                    name,
                    when: (answers) => answers[name] === manualEntryChoice,
                    message: ROOT_PROMPT,
                }]);
        }
        else {
            return inquirer_1.prompt([{
                    name,
                    message: ROOT_PROMPT,
                    default: '.',
                }]);
        }
    });
}
function askRootOfWebApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const answers = yield askQuestion();
        const globDirectory = answers[name];
        try {
            const stat = yield fse.stat(globDirectory);
            assert(stat.isDirectory());
        }
        catch (error) {
            throw new Error(errors_1.errors['glob-directory-invalid']);
        }
        return globDirectory;
    });
}
exports.askRootOfWebApp = askRootOfWebApp;
;

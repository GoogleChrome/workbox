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
exports.askConfigLocation = void 0;
const assert = require("assert");
const inquirer_1 = require("inquirer");
const common_tags_1 = require("common-tags");
const constants_1 = require("../constants");
const errors_1 = require("../errors");
// The key used for the question/answer.
const name = 'configLocation';
/**
 * @return {Promise<Object>} The answers from inquirer.
 */
function askQuestion() {
    return inquirer_1.prompt([{
            name,
            message: common_tags_1.oneLine `Where would you like to save these configuration options?`,
            type: 'input',
            default: constants_1.constants.defaultConfigFile,
        }]);
}
function askConfigLocation() {
    return __awaiter(this, void 0, void 0, function* () {
        const answers = yield askQuestion();
        const configLocation = answers[name].trim();
        assert(configLocation, errors_1.errors['invalid-config-location']);
        return configLocation;
    });
}
exports.askConfigLocation = askConfigLocation;
;

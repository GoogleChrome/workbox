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
exports.runWizard = void 0;
const fse = require("fs-extra");
const common_tags_1 = require("common-tags");
const ask_questions_1 = require("./questions/ask-questions");
const logger_js_1 = require("./logger.js");
function runWizard(options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { configLocation, config } = yield ask_questions_1.askQuestions(options);
        const contents = `module.exports = ${JSON.stringify(config, null, 2)};`;
        yield fse.writeFile(configLocation, contents);
        const command = ("injectManifest" in options) ? 'injectManifest' : 'generateSW';
        logger_js_1.logger.log(`To build your service worker, run

  workbox ${command} ${configLocation}

as part of a build process. See https://goo.gl/fdTQBf for details.`);
        const configDocsURL = ("injectManifest" in options) ?
            'https://goo.gl/8bs14N' :
            'https://goo.gl/gVo87N';
        logger_js_1.logger.log(common_tags_1.oneLine `You can further customize your service worker by making changes
    to ${configLocation}. See ${configDocsURL} for details.`);
    });
}
exports.runWizard = runWizard;
;

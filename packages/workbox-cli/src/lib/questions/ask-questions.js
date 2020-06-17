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
exports.askQuestions = void 0;
const ask_config_location_1 = require("./ask-config-location");
const ask_extensions_to_cache_1 = require("./ask-extensions-to-cache");
const ask_root_of_web_app_1 = require("./ask-root-of-web-app");
const ask_sw_dest_1 = require("./ask-sw-dest");
const ask_sw_src_1 = require("./ask-sw-src");
function askQuestions(options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const globDirectory = yield ask_root_of_web_app_1.askRootOfWebApp();
        const globPatterns = yield ask_extensions_to_cache_1.askExtensionsToCache(globDirectory);
        const swSrc = ("injectManifest" in options) ? yield ask_sw_src_1.askSWSrc() : undefined;
        const swDest = yield ask_sw_dest_1.askSWDest(globDirectory);
        const configLocation = yield ask_config_location_1.askConfigLocation();
        const config = {
            globDirectory,
            globPatterns,
            swDest,
            swSrc,
        };
        return {
            config,
            configLocation,
        };
    });
}
exports.askQuestions = askQuestions;
;

#! /usr/bin/env node
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
const meow = require("meow");
const updateNotifier = require("update-notifier");
const app_1 = require("./app");
const cleanup_stack_trace_js_1 = require("./lib/cleanup-stack-trace.js");
const help_text_1 = require("./lib/help-text");
const logger_1 = require("./lib/logger");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const params = meow(help_text_1.helpText);
    updateNotifier({ pkg: params.pkg }).notify(); //FIX This is dubious
    try {
        yield app_1.app(params);
    }
    catch (error) {
        // Show the full error and stack trace if we're run with --debug.
        if (params.flags.debug) {
            logger_1.logger.error(`\n${error.stack}`);
        }
        else {
            logger_1.logger.error(`\n${error.message}`);
            logger_1.logger.debug(`${cleanup_stack_trace_js_1.cleanupStackTrace(error, 'app.js')}\n`);
        }
        process.exit(1);
    }
}))();

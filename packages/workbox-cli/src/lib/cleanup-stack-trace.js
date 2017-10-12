/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

// Helper to parse out less relevant info from an Error's stack trace.
// Removes the initial portion, since that's obtained from error.message.
// Removes every stack frame earlier than the last instance of moduleName,
// since that's just frames related to the Node runtime/loader.
module.exports = (error, moduleName) => {
  const frames = error.stack.split(`\n`);
  let startFrame = null;
  let lastFrame = 0;
  frames.forEach((frame, index) => {
    if (startFrame === null && frame.includes(`    at `)) {
      startFrame = index;
    }

    if (frame.includes(`${moduleName}:`)) {
      lastFrame = index;
    }
  });
  return frames.slice(startFrame, lastFrame + 1).join(`\n`);
};

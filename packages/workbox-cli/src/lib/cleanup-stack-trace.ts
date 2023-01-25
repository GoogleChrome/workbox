/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// Helper to parse out less relevant info from an Error's stack trace.
// Removes the initial portion, since that's obtained from error.message.
// Removes every stack frame earlier than the last instance of moduleName,
// since that's just frames related to the Node runtime/loader.
export function cleanupStackTrace(error: Error, moduleName: string): string {
  if (!error.stack) {
    return '';
  }
  const frames = error.stack.split(`\n`);
  let startFrame: number | undefined;
  let lastFrame = 0;
  frames.forEach((frame, index) => {
    if (startFrame === undefined && frame.includes(`    at `)) {
      startFrame = index;
    }

    if (frame.includes(`${moduleName}:`)) {
      lastFrame = index;
    }
  });
  return frames.slice(startFrame, lastFrame + 1).join(`\n`);
}

/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import path from 'path';
import fs from 'fs/promises';
import {Task} from '..';

const DEFAULT_CONFIG_FILE_NAME = 'taskts-config.ts';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch (err) {
    return false;
  }
}

async function getConfigFilePath(configName: string): Promise<string | null> {
  let currentDir = path.dirname(process.cwd());
  while (currentDir) {
    const possiblePath = path.join(currentDir, configName);
    if (await fileExists(possiblePath)) {
      return possiblePath;
    }

    const parentDir = path.resolve(currentDir, '..');
    if (currentDir === parentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

export async function loadConfig(
  configFilePath?: string,
): Promise<Record<string, Task>> {
  if (configFilePath) {
    if (!(await fileExists(configFilePath))) {
      return null;
    }
  } else {
    configFilePath = await getConfigFilePath(DEFAULT_CONFIG_FILE_NAME);
    if (!configFilePath) {
      return null;
    }
  }

  const {dir, name} = path.parse(configFilePath);
  console.log(`Using config file ${configFilePath}`);

  if (dir !== process.cwd()) {
    console.log(`Changing directory to ${dir}`);
    process.chdir(dir);
  }

  return await import(path.join(dir, name));
}

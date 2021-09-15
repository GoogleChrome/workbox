/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import chalk from 'chalk';

import {Task} from '../index';
import {log} from './log';

export class TaskLogger {
  static count = 1;
  static nameRegistry = new Set<string>();
  static taskColor = chalk.blueBright;
  static timeColor = chalk.magentaBright;

  private taskDisplayName: string | null;
  startTime?: number;

  constructor(task: Task | string) {
    if (typeof task === 'string') {
      this.taskDisplayName = TaskLogger.taskColor(TaskLogger.uniqueName(task));
    } else {
      if (task.name) {
        if (task.name === '_') {
          this.taskDisplayName = null;
        } else {
          this.taskDisplayName = TaskLogger.taskColor(
            TaskLogger.uniqueName(task.name),
          );
        }
      } else {
        this.taskDisplayName = TaskLogger.taskColor(
          TaskLogger.uniqueName('<anonymous>'),
        );
      }
    }
  }

  static uniqueName(name: string): string {
    let effectiveName = name;
    if (TaskLogger.nameRegistry.has(name)) {
      effectiveName = `${name}#${TaskLogger.count++}`;
    }
    TaskLogger.nameRegistry.add(effectiveName);
    return effectiveName;
  }

  elapsed(): string {
    let time =
      this.startTime !== undefined
        ? ((Date.now() - this.startTime) / 1000).toFixed(2)
        : '<unknown>';
    return TaskLogger.timeColor(time);
  }

  logStart(): void {
    if (this.taskDisplayName) {
      this.startTime = Date.now();
      log(`Starting '${this.taskDisplayName}'...`);
    }
  }

  logEnd(): void {
    if (this.taskDisplayName) {
      log(
        `Finished '${this.taskDisplayName}' after ${this.elapsed()} seconds.`,
      );
    }
  }

  logError(): void {
    if (this.taskDisplayName) {
      log(`Errored '${this.taskDisplayName}' after ${this.elapsed()} seconds.`);
    }
  }
}

/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import eslint from 'gulp-eslint';
import express from 'express';
import gulp from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import minimist from 'minimist';
import mocha from 'gulp-mocha';
import npmPath from 'npm-path';
import path from 'path';
import promisify from 'promisify-node';
import rename from 'gulp-rename';
import runSequence from 'run-sequence';
import serveIndex from 'serve-index';
import serveStatic from 'serve-static';
import {globPromise, processPromiseWrapper, taskHarness} from './build-utils.js';

const fsePromise = promisify('fs-extra');
const tmpPromise = promisify('tmp');
const ghPagesPromise = promisify('gh-pages');

const options = minimist(process.argv.slice(2));
const projectOrStar = options.project || '*';

// Before doing anything, modify process.env.PATH so the the ChromeDriver
// and documentation binaries in node_modules/.bin are picked up.
npmPath.setSync();

/**
 * Lints a given project.
 * @param project The path to a project directory.
 * @returns {Promise} Resolves if linting succeeds, rejects if it fails.
 */
const lintPackage = project => {
  return new Promise((resolve, reject) => {
    gulp.src([`${project}/**/*.js`, `!${project}/build/**`])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.results(results => {
        if ((results.warningCount + results.errorCount) > 0) {
          reject(`Linting '${project}' failed.`);
        } else {
          resolve();
        }
      }));
  });
};

/**
 * Buids a given project.
 * @param project The path to a project directory.
 * @returns {Promise} Resolves if building succeeds, rejects if it fails.
 */
const buildPackage = project => {
  const buildDir = `${project}/build`;

  // Copy over package.json and README.md so that build/ contains what we
  // need to publish to npm.
  return fsePromise.emptyDir(buildDir)
    .then(() => fsePromise.copy(`${project}/package.json`,
      `${buildDir}/package.json`))
    .then(() => fsePromise.copy(`${project}/README.md`,
      `${buildDir}/README.md`))
    .then(() => {
      // Let each project define its own build process.
      const build = require(`./${project}/build.js`);
      return build();
    });
};

/**
 * Documents a given project.
 * @param project The path to a project directory.
 * @returns {Promise} Resolves if documenting succeeds, rejects if it fails.
 */
const documentPackage = project => {
  const projectMetadata = require(`./${project}/package.json`);
  return new Promise(resolve => {
    // First, use metadata from package.json to write out an initial README.md.
    gulp.src('templates/Project-README.hbs')
      .pipe(handlebars({
        name: projectMetadata.name,
        description: projectMetadata.description,
        background: projectMetadata.background
      }))
      .pipe(rename('README.md'))
      .pipe(gulp.dest(project))
      .on('end', resolve);
  }).then(() => {
    // Then use the inline JSDoc to populate the "API" section.
    return globPromise(`${project}/src/**/*.js`).then(files => {
      const args = ['readme', ...files, '--github', '--section', 'API',
        '--readme-file', `${project}/README.md`];
      return processPromiseWrapper('documentation', args);
    });
  });
};

/**
 * Publishes a given project to npm.
 * @param project The path to a project directory.
 * @returns {Promise} Resolves if publishing succeeds, rejects if it fails.
 */
const publishPackage = project => {
  return processPromiseWrapper('npm', ['publish', `${project}/build`]);
};

gulp.task('lint', () => {
  return taskHarness(lintPackage, projectOrStar);
});

gulp.task('test', () => {
  return gulp.src(`projects/${projectOrStar}/test/*.js`, {read: false})
    .pipe(mocha());
});

gulp.task('build', () => {
  return taskHarness(buildPackage, projectOrStar);
});

gulp.task('build:watch', unusedCallback => {
  gulp.watch(`projects/${projectOrStar}/src/**/*`, ['build']);
  gulp.watch(`lib/**/*`, ['build']);
});

gulp.task('serve', unusedCallback => {
  const port = options.port || 3000;
  const app = express();
  const rootDirectory = projectOrStar === '*' ?
    'projects' :
    path.join('projects', projectOrStar);

  app.use(serveStatic(rootDirectory));
  app.use(serveIndex(rootDirectory, {view: 'details'}));
  app.listen(port, () => {
    console.log(`Serving '${rootDirectory}' at http://localhost:${port}/`);
  });
});

gulp.task('documentation:projects', () => {
  return taskHarness(documentPackage, projectOrStar);
});

gulp.task('documentation:repo', ['build'], () => {
  if (projectOrStar !== '*') {
    throw Error('Please do not use --project= with documentation:repo.');
  }

  return new Promise(resolve => {
    // First, generate a repo README.md based on metadata from each project.
    return globPromise('projects/*/package.json')
      .then(pkgs => pkgs.map(pkg => require(`./${pkg}`)))
      .then(projects => {
        gulp.src('templates/README.hbs')
          .pipe(handlebars({projects: projects}))
          .pipe(rename({extname: '.md'}))
          .pipe(gulp.dest('.'))
          .on('end', resolve);
      });
  }).then(() => {
    // Then publish all of the build + demo files to gh-pages.
    return tmpPromise.dir().then(tmpDir => {
      return new Promise(resolve => {
        gulp.src('projects/*/{build,demo}/**')
          .pipe(gulp.dest(tmpDir))
          .on('end', resolve);
      }).then(() => ghPagesPromise.publish(tmpDir));
    });
  });
});

gulp.task('documentation', ['documentation:repo', 'documentation:projects']);

gulp.task('publish', callback => {
  if (projectOrStar === '*') {
    throw Error('Please use the --project= parameter to specify a project.');
  }

  // We need things run in a specific sequence: the project-level documentation
  // needs to be created before build, so that the correct README.md is copied
  // over to the build/ directory.
  runSequence(['lint', 'test'], 'documentation:projects', 'build', () => {
    return taskHarness(publishPackage, projectOrStar).then(() => callback());
  });
});

gulp.task('default', callback => {
  runSequence(['lint', 'test'], 'documentation', callback);
});

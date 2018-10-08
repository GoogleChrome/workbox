/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');

const AnalyseBuildForProperties = require('./utils/analyse-properties');

gulp.task('analyze-properties:run', async () => {
  const analysisTool = new AnalyseBuildForProperties();
  const results = await analysisTool.run();
  results.forEach((entry) => {
    analysisTool.printDetails(entry);
  });
});

gulp.task('analyze-properties',
    gulp.series(['build', 'analyze-properties:run']));

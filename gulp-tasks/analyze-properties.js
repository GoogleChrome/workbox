const gulp = require('gulp');

const build = require('./build');

const AnalyseBuildForProperties = require('./utils/analyse-properties');

const runAnalyzeProperties = async () => {
  const analysisTool = new AnalyseBuildForProperties();
  const results = await analysisTool.run();
  results.forEach((entry) => {
    analysisTool.printDetails(entry);
  });
};
runAnalyzeProperties.displayName = 'analyze-properties:run';

const analyzeProperties = gulp.series(
  build,
  runAnalyzeProperties,
);
analyzeProperties.displayName = 'analyze-properties';

module.exports = analyzeProperties;

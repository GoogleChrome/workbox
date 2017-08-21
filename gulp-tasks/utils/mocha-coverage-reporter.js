const istanbul = require('istanbul');
const MochaSpecReporter = require('mocha/lib/reporters/spec');
const logHelper = require('./log-helper');

// This must be a function to work with mocha who calls "new RepoterFunc()"
module.exports = function(runner) {
  new MochaSpecReporter(runner);

  const collector = new istanbul.Collector();
  const reporter = new istanbul.Reporter();
  reporter.addAll(['lcov', 'json']);
  reporter.add('text');

  runner.on('end', () => {
    if (global.__coverage__) {
      collector.add(global.__coverage__);
      reporter.write(collector, true, () => {});
    } else {
      logHelper.warn('Mocha reporter unable to collect Coverage Data.');
    }
  });
};

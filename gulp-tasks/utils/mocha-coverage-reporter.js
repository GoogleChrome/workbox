const instanbul = require('istanbul');
const MochaSpecReporter = require('mocha/lib/reporters/spec');

// This must be a function to work with mocha who calls "new RepoterFunc()"
module.exports = function(runner) {
  new MochaSpecReporter(runner);

  const collector = new instanbul.Collector();
  const reporter = new instanbul.Reporter();
  reporter.addAll(['lcov', 'json']);
  reporter.add('text');

  runner.on('end', () => {
    collector.add(global.__coverage__);
    reporter.write(collector, true, () => {});
  });
};

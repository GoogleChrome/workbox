const instanbul = require('istanbul');
const MochaSpecReporter = require('mocha/lib/reporters/spec');

module.exports = (runner) => {
  const collector = new instanbul.Collector();
  const reporter = new instanbul.Reporter();
  reporter.addAll(['lcov', 'json']);
  new MochaSpecReporter(runner);

  runner.on('end', () => {
    collector.add(global.__coverage__);

    reporter.write(collector, true, () => {
      /* eslint-disable no-console */
        console.log('report generated');
    });
  });
};

describe('Test Example Projects', function() {
  it('should be able to generate manifest for example-1', function() {
    const SWCli = proxyquire('../src/cli/index', {
      inquirer: {
        prompt: (questions) => {
          console.log(questions);
          return Promise.reject('Oops');
        },
      },
    });

    const cli = new SWCli();
    return cli.argv['generate-sw'];
  });
});

module.exports = (title, cb) => {
  const environments = ['dev', 'production'];
  environments.forEach((env) => {
    describe(`{${env}}`, function() {
      let originalEnv;
      before(function() {
        originalEnv = process.env.NODE_ENV;

        process.env.NODE_ENV = env;
      });

      after(function() {
        process.env.NODE_ENV = originalEnv;
      });

      describe(title, cb);
    });
  });
};

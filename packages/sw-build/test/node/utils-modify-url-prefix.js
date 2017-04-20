const modifyUrlPrefix = require('../../src/lib/utils/modify-url-prefix');
const errors = require('../../src/lib/errors');

describe('Test modifyUrlPrefix Logic', function() {
  const EXAMPLE_MODIFIERS = {
    '/example-1': '/example-1-altered',
    '/example-2/multi-section/1234': '/example-2-altered/5678',
  };

  it('should handle bad url input', function() {
    const badInputs = [
      null,
      undefined,
      true,
      false,
      {},
      [],
    ];
    badInputs.forEach((badInput) => {
      try {
        modifyUrlPrefix(badInput, EXAMPLE_MODIFIERS);
        throw new Error('No error thrown when it should have.');
      } catch (err) {
        if (err.message !== errors['modify-url-prefix-bad-url']) {
          console.log('Input: ', badInput);
          console.log(err);
          throw new Error('Unexpected error thrown');
        }
      }
    });
  });

  it('should handle bad modifyUrlPrefix input', function() {
    const badInputs = [
      null,
      undefined,
      true,
      false,
      [],
      '',
      {
        'Hi': [],
      },
    ];
    badInputs.forEach((badInput) => {
      try {
        modifyUrlPrefix('/', badInput);
        throw new Error('No error thrown when it should have.');
      } catch (err) {
        if (err.message !== errors['modify-url-prefix-bad-prefixes']) {
          console.log('Input: ', badInput);
          console.log(err);
          throw new Error('Unexpected error thrown');
        }
      }
    });
  });

  it('should be able to use as a stripping prefix tool', function() {
    const modifiers = {
      '/first-match': '',
    };
    const newUrl = modifyUrlPrefix('/first-match/12345/hello', modifiers);
    newUrl.should.equal('/12345/hello');
  });

  it('should be able to prepend to urls', function() {
    const modifiers = {
      '': '/public',
    };
    const newUrl = modifyUrlPrefix('/example/12345/hello', modifiers);
    newUrl.should.equal('/public/example/12345/hello');
  });

  it('should only apply the first match', function() {
    const modifiers = {
      '/first-match': '/second-match',
      '/second-match': '/third-match',
    };
    const newUrl = modifyUrlPrefix('/first-match/12345/hello', modifiers);
    newUrl.should.equal('/second-match/12345/hello');

    const secondNewUrl = modifyUrlPrefix('/second-match/67890/goodbye', modifiers);
    secondNewUrl.should.equal('/third-match/67890/goodbye');
  });

  it('should only match at the start of a url', function() {
    const modifiers = {
      '/first-match': '/altered',
    };
    const newUrl = modifyUrlPrefix('/example/first-match/12345/hello', modifiers);
    newUrl.should.equal('/example/first-match/12345/hello');
  });
});

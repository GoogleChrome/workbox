import {expect} from 'chai';
import {Deferred} from '../../../../packages/workbox-core/_private/Deferred.mjs';

describe(`[workbox-core] Deferred`, function() {
  describe(`constructor`, function() {
    it(`should create a promise and expose its resolve and reject functions as methods`, function() {
      expect(new Deferred().promise).to.be.an.instanceof(Promise);
    });
  });

  describe(`resolve`, function() {
    it(`should resolve the Deferred's promise`, function() {
      const deferred = new Deferred();
      deferred.resolve();

      return deferred.promise;
    });
  });

  describe(`reject`, function() {
    it(`should reject the Deferred's promise with the passed error`, function(done) {
      const deferred = new Deferred();
      const err1 = new Error('1');
      deferred.reject(err1);

      deferred.promise.catch((err2) => {
        expect(err1).to.eql(err2);
        done();
      });
    });
  });
});

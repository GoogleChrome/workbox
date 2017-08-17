import {expect} from 'chai';

import messageGenerator from '../../../../../../packages/workbox-core/INTERNAL/models/messages/messageGenerator.mjs';

describe('messageGenerator - ${process.env.NODE_ENV}', function() {
  it('should return null for prod', function() {
    // Returning null ensures it's excluded in prod builds including
    // the message text.
    if (process.env.NODE_ENV === 'prod') {
      expect(messageGenerator).to.equal(null);
    } else {
      expect(messageGenerator).to.not.equal(null);
    }
  });

  // If the generator doesn't exist, then we have nothing to test.
  if (!messageGenerator) {
    return;
  }

  it('should return the code if the code is unknown', function() {
    const message = messageGenerator('fake-code');
    expect(message).to.equal('fake-code');
  });

  it('should return the message if the code is known', function() {
    const message = messageGenerator('invalid-type');
    expect(message).to.not.equal('invalid-type');
  });

  it('should manage messages which are strings', function() {
    const message = messageGenerator('welcome-message');
    expect(message).to.not.equal('welcome-message');
  })
});

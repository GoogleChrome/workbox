import {expect} from 'chai';

import messageGenerator from '../../../../../../packages/workbox-core/INTERNAL/models/messages/messageGenerator.mjs';

describe(`messageGenerator - ${process.env.NODE_ENV}`, function() {
  const detailsObj = {
    exampleDetail: 'With Value',
  };
  const detailsString = `${JSON.stringify([detailsObj])}`;
  it('should return the code if the code is unknown', function() {
    const message = messageGenerator('fake-code');
    expect(message).to.equal('fake-code');
  });

  it('should return the code with details if the code is unknown', function() {
    const message = messageGenerator('fake-code', detailsObj);
    expect(message).to.equal(`fake-code :: ${detailsString}`);
  });

  it('should return the code if the code is valid, requires specific details but nothing given', function() {
    const message = messageGenerator('invalid-type');
    expect(message).to.equal(`invalid-type`);
  });

  it('should return the code if the code is valid but requires specific details', function() {
    const message = messageGenerator('invalid-type', detailsObj);
    expect(message).to.equal(`invalid-type :: ${detailsString}`);
  });

  it('should return the message if the code and details are valid', function() {
    const invalidTypeDetails = {
      paramName: 'Param',
      expectedType: 'Type',
      value: {
        example: 'Value',
      },
    };
    const message = messageGenerator('invalid-type', invalidTypeDetails);
    if (process.env.NODE_ENV === 'prod') {
      expect(message).to.equal(`invalid-type :: ${JSON.stringify([invalidTypeDetails])}`);
    } else {
      expect(message.indexOf('invalid-type')).to.equal(-1);
    }
  });
});

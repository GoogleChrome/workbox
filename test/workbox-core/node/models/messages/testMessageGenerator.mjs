import {expect} from 'chai';

import constants from '../../../../../gulp-tasks/utils/constants.js';

import messageGenerator from '../../../../../packages/workbox-core/models/messages/messageGenerator.mjs';

describe(`[workbox-core] messageGenerator`, function() {
  const detailsObj = {
    exampleDetail: 'With Value',
  };
  const detailsString = `${JSON.stringify([detailsObj])}`;

  it('should handle unknown codes', function() {
    if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) {
      const message = messageGenerator('fake-code');

      expect(message).to.equal('fake-code');
    } else {
      expect(() => {
        messageGenerator('fake-code');
      }).to.throw();
    }
  });

  it('should return the code with details if the code is unknown', function() {
    if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) {
      const message = messageGenerator('fake-code', detailsObj);
      expect(message).to.equal(`fake-code :: ${detailsString}`);
    } else {
      expect(() => {
        messageGenerator('fake-code', detailsObj);
      }).to.throw();
    }
  });

  it('should throw an error if the code is valid but no required details are defined', function() {
    if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) {
      const message = messageGenerator('incorrect-type');
      expect(message).to.equal(`incorrect-type`);
    } else {
      expect(() => {
        messageGenerator('incorrect-type');
      }).to.throw();
    }
  });

  it('should throw an error if the code is valid but the arguments are missing details', function() {
    if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) {
      const message = messageGenerator('incorrect-type', detailsObj);
      expect(message).to.equal(`incorrect-type :: ${detailsString}`);
    } else {
      expect(() => {
        messageGenerator('incorrect-type', {random: 'details'});
      }).to.throw();
    }
  });

  it('should return the message if the code and details are valid', function() {
    const invalidTypeDetails = {
      moduleName: 'test',
      className: 'test',
      funcName: 'test',
      paramName: 'Param',
      expectedType: 'Type',
    };

    const message = messageGenerator('incorrect-type', invalidTypeDetails);
    if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) {
      expect(message).to.equal(`incorrect-type :: ${JSON.stringify([invalidTypeDetails])}`);
    } else {
      expect(message.indexOf('incorrect-type')).to.equal(-1);
    }
  });
});

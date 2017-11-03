import {expect} from 'chai';
import getFriendlyURL from '../../../../packages/workbox-core/_private/getFriendlyURL.mjs';

describe(`[workbox-core] getFriendlyURL()`, function() {
  it(`should return short URL for local origin '/'`, function() {
    const url = getFriendlyURL('/');
    expect(url).to.equal('/');
  });

  it(`should return short URL for local origin '<local origin>/hi'`, function() {
    const fullUrl = new URL('/hi', self.location).toString();
    const url = getFriendlyURL(fullUrl);
    expect(url).to.equal('/hi');
  });

  it(`should return full URL for external origin 'https://external-example.com/example'`, function() {
    const url = getFriendlyURL('https://external-example.com/example');
    expect(url).to.equal('https://external-example.com/example');
  });
});

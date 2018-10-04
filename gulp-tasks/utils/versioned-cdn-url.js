const {getCDNOrigin} = require(
    '../../packages/workbox-build/src/lib/cdn-utils');
const lernaPkg = require('../../lerna.json');

module.exports = () => `${getCDNOrigin()}/${lernaPkg.version}`;

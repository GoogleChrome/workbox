let EXAMPLE_REVISIONED_FILES_SET_1_STEP_1 = [
  '/__echo/date/1.1234.txt',
  '/__echo/date/2.1234.txt',
  {
    path: '/__echo/date/3.txt',
    revision: '1234',
  },
  {
    path: '/__echo/date/4.txt',
    revision: '1234',
  },
  new URL('/__echo/date/5.1234.txt', location.origin).toString(),
  new URL('/__echo/date/6.1234.txt', location.origin).toString(),
  {
    path: new URL('/__echo/date/7.txt', location.origin).toString(),
    revision: '1234',
  },
  {
    path: new URL('/__echo/date/8.txt', location.origin).toString(),
    revision: '1234',
  },
];
let EXAMPLE_REVISIONED_FILES_SET_1_STEP_2 = [
  '/__echo/date/1.5678.txt',
  '/__echo/date/2.1234.txt',
  {
    path: '/__echo/date/3.txt',
    revision: '5678',
  },
  {
    path: '/__echo/date/4.txt',
    revision: '1234',
  },
  new URL('/__echo/date/5.5678.txt', location.origin).toString(),
  new URL('/__echo/date/6.1234.txt', location.origin).toString(),
  {
    path: new URL('/__echo/date/7.txt', location.origin).toString(),
    revision: '5678',
  },
  {
    path: new URL('/__echo/date/8.txt', location.origin).toString(),
    revision: '1234',
  },
];

let thirdPartyServer;
if (location.origin === 'http://localhost:3000') {
  thirdPartyServer = 'http://localhost:3001';
} else {
  const getParameterByName = (name) => {
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };

  thirdPartyServer = getParameterByName('thirdPartyServer');
}

if (thirdPartyServer) {
  const thirdPartySet1 = [
    new URL('/__echo/date-with-cors/9.1234.txt', thirdPartyServer).toString(),
    new URL('/__echo/date-with-cors/10.1234.txt', thirdPartyServer).toString(),
    {
      path: new URL('/__echo/date-with-cors/11.txt', thirdPartyServer).toString(),
      revision: '1234',
    },
    {
      path: new URL('/__echo/date-with-cors/12.txt', thirdPartyServer).toString(),
      revision: '1234',
    },
  ];
  const thirdPartySet2 = [
    new URL('/__echo/date-with-cors/9.5678.txt', thirdPartyServer).toString(),
    new URL('/__echo/date-with-cors/10.1234.txt', thirdPartyServer).toString(),
    {
      path: new URL('/__echo/date-with-cors/11.txt', thirdPartyServer).toString(),
      revision: '5678',
    },
    {
      path: new URL('/__echo/date-with-cors/12.txt', thirdPartyServer).toString(),
      revision: '1234',
    },
  ];
  EXAMPLE_REVISIONED_FILES_SET_1_STEP_1 = EXAMPLE_REVISIONED_FILES_SET_1_STEP_1.concat(thirdPartySet1);
  EXAMPLE_REVISIONED_FILES_SET_1_STEP_2 = EXAMPLE_REVISIONED_FILES_SET_1_STEP_2.concat(thirdPartySet2);
}

self.goog = self.goog || {};
self.goog.__TEST_DATA = {
  'set-1': {
    'step-1': EXAMPLE_REVISIONED_FILES_SET_1_STEP_1,
    'step-2': EXAMPLE_REVISIONED_FILES_SET_1_STEP_2,
  },
};

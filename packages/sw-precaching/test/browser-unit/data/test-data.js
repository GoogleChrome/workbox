const EXAMPLE_REVISIONED_FILES_SET_1_STEP_1 = [
  '/__echo/date/1.1234.txt',
  '/__echo/date/2.1234.txt',
  {path: '/__echo/date/3.txt', revision: '1234'},
  {path: '/__echo/date/4.txt', revision: '1234'},
];
const EXAMPLE_REVISIONED_FILES_SET_1_STEP_2 = [
  '/__echo/date/1.5678.txt',
  '/__echo/date/2.1234.txt',
  {path: '/__echo/date/3.txt', revision: '5678'},
  {path: '/__echo/date/4.txt', revision: '1234'},
];

self.goog = self.goog || {};
self.goog.__TEST_DATA = {
  'set-1': {
    'step-1': EXAMPLE_REVISIONED_FILES_SET_1_STEP_1,
    'step-2': EXAMPLE_REVISIONED_FILES_SET_1_STEP_2,
  },
};

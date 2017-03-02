self.goog.__TEST_DATA['sw-lib'] = {
  revisioned: {
    'set-1': self.goog.__TEST_DATA['set-1']['step-1'],
    'set-2': [
      '/__echo/date/sw-lib-1.1234.txt',
      {url: '/__echo/date/sw-lib-2.txt', revision: '1234'},
    ],
    'set-3': [
      '/__echo/date/sw-lib-3.1234.txt',
      {url: '/__echo/date/sw-lib-4.txt', revision: '1234'},
    ],
    'set-4': [
      '/__echo/date/sw-lib-1.5678.txt',
      {url: '/__echo/date/sw-lib-2.txt', revision: '5678'},
    ],
    'set-5': [
      '/__echo/date/sw-lib-3.1234.txt',
      {url: '/__echo/date/sw-lib-4.txt', revision: '1234'},
    ],
    'set-6': [
      '/__echo/date/sw-lib-5.1234.txt',
      {url: '/__echo/date/sw-lib-6.txt', revision: '1234'},
    ],
  },
  unrevisioned: {
    'set-1': [
      '/__echo/date/sw-lib-1.txt',
      new Request('/__echo/date/sw-lib-2.txt'),
    ],
    'set-2': [
      '/__echo/date/sw-lib-3.txt',
      new Request('/__echo/date/sw-lib-4.txt'),
    ],
    'set-3': [
      '/__echo/date/sw-lib-5.txt',
      new Request('/__echo/date/sw-lib-6.txt'),
    ],
    'set-4': [
      '/__echo/date/sw-lib-7.txt',
      new Request('/__echo/date/sw-lib-8.txt'),
    ],
    'set-5': [
      '/__echo/date/sw-lib-9.txt',
      new Request('/__echo/date/sw-lib-10.txt'),
    ],
    'set-6': [
      '/__echo/date/sw-lib-11.txt',
      new Request('/__echo/date/sw-lib-12.txt'),
    ],
  },
};

let secondaryServer = `${location.protocol}//${location.hostname}:${parseInt(location.port) + 1}`;

const EXAMPLE_REVISIONED_FILES_SET_1_STEP_1 = [];
const EXAMPLE_REVISIONED_FILES_SET_1_STEP_2 = [];

const revision1 = ['1234', '1234'];
const revision2 = ['5678', '1234'];

let fileIndex = 0;

const addNewEntry = (origin) => {
  let echoPath = '/__echo/date';
  if (!origin) {
    origin = '';
  }

  if (origin === secondaryServer) {
    echoPath = '/__echo/date-with-cors';
  }

  for (let i = 0; i < revision1.length; i++) {
    EXAMPLE_REVISIONED_FILES_SET_1_STEP_1.push(`${origin}${echoPath}/${fileIndex}.${revision1[i]}.txt`);
    EXAMPLE_REVISIONED_FILES_SET_1_STEP_2.push(`${origin}${echoPath}/${fileIndex}.${revision2[i]}.txt`);
    fileIndex++;

    EXAMPLE_REVISIONED_FILES_SET_1_STEP_1.push({
      url: `${origin}${echoPath}/${fileIndex}.txt`,
      revision: revision1[i],
    });
    EXAMPLE_REVISIONED_FILES_SET_1_STEP_2.push({
      url: `${origin}${echoPath}/${fileIndex}.txt`,
      revision: revision2[i],
    });
    fileIndex++;

    /** EXAMPLE_REVISIONED_FILES_SET_1_STEP_1.push({
      path: new Request(`${origin}${echoPath}/${fileIndex}.${revision1[i]}.txt`),
      revision: revision1[i],
    });
    EXAMPLE_REVISIONED_FILES_SET_1_STEP_2.push({
      path: new Request(`${origin}${echoPath}/${fileIndex}.${revision2[i]}.txt`),
      revision: revision2[i],
    });
    fileIndex++;**/
  }
};

// Add entries with relative path
addNewEntry();

// Add entries with absolute path for this origin
addNewEntry(location.origin);

// Add entries with absolute path for a foreign origin
addNewEntry(secondaryServer);

self.goog = self.goog || {};
self.goog.__TEST_DATA = {
  'set-1': {
    'step-1': EXAMPLE_REVISIONED_FILES_SET_1_STEP_1,
    'step-2': EXAMPLE_REVISIONED_FILES_SET_1_STEP_2,
  },
  'duplicate-entries': [
    [
      '/__echo/date/1.1234.txt',
      '/__echo/date/2.1234.txt',
      '/__echo/date/3.1234.txt',
      '/__echo/date/4.1234.txt',
    ],
    [
      '/__echo/date/2.1234.txt',
      '/__echo/date/4.1234.txt',
      '/__echo/date/5.1234.txt',
    ],
    [
      '/__echo/date/1.1234.txt',
      '/__echo/date/3.1234.txt',
      '/__echo/date/6.1234.txt',
    ],
  ],
  '404': [
    '/__test/404/',
  ],
  'opaque': [
    `${secondaryServer}/__echo/date/hello.txt`,
  ],
};

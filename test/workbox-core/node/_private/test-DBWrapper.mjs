import {expect} from 'chai';
import sinon from 'sinon';

// import {reset as iDBReset} from 'shelving-mock-indexeddb';

import DBWrapper from '../../../../packages/workbox-core/_private/DBWrapper.mjs';


const catchAsyncError = async (promiseOrFn) => {
  try {
    await (typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn);
    throw new Error('Expected error never thrown');
  } catch (err) {
    return err;
  }
};

const data = {
  // keyPath: email, index: email (unique)
  users: [
    // Sorted by email (ascending) so entry order will be the same.
    {email: 'bob@gmail.com', firstName: 'Bob', lastName: 'Dal'},
    {email: 'jen@gmail.com', firstName: 'Jen', lastName: 'Yoo'},
    {email: 'ray@gmail.com', firstName: 'Ray', lastName: 'Ban'},
  ],
  // autoIncrement, index: userEmail
  posts: [
    {userEmail: 'bob@gmail.com', content: 'Duis et velit dapibus rhoncus.'},
    {userEmail: 'jen@gmail.com', content: 'Vestibulum vulputate augue imper.'},
    {userEmail: 'ray@gmail.com', content: 'In at eros at magna.'},
    {userEmail: 'ray@gmail.com', content: 'Suspendisse id neque sodales con.'},
    {userEmail: 'jen@gmail.com', content: 'Donec vestibum magna quis augue.'},
    {userEmail: 'ray@gmail.com', content: 'Pellentesque faucus magna in la.'},
  ],
  // autoIncrement, index: userEmail, postId
  comments: [
    {
      userEmail: 'ray@gmail.com',
      postId: 1,
      content: 'Pellentesque ut justo non ipsum.',
    },
    {
      userEmail: 'jen@gmail.com',
      postId: 1,
      content: 'Etiam commodo tellus in lectus.',
    },
    {
      userEmail: 'bob@gmail.com',
      postId: 2,
      content: 'Vivamus sit amet eros in.',
    },
    {
      userEmail: 'bob@gmail.com',
      postId: 4,
      content: 'Integer eu quam consequat dictum.',
    },
    {
      userEmail: 'bob@gmail.com',
      postId: 5,
      content: 'Aliquam non eros vulputate scelerisque.',
    },
  ],
};

const createTestDb = async () => {
  return await new DBWrapper('db', 1, {
    onupgradeneeded: (evt) => {
      const db = evt.target.result;
      db.createObjectStore('users', {keyPath: 'email'});

      const postsStore = db.createObjectStore('posts', {autoIncrement: true});
      postsStore.createIndex('userEmail', 'userEmail', {unique: false});

      const commentsStore = db.createObjectStore(
          'comments', {autoIncrement: true});
      commentsStore.createIndex('userEmail', 'userEmail', {unique: false});
      commentsStore.createIndex('postId', 'postId', {unique: false});
    },
  });
};

const createAndPopulateTestDb = async () => {
  const db = await createTestDb();

  await db.transaction(Object.keys(data), 'readwrite', (stores) => {
    for (const [storeName, storeEntries] of Object.entries(data)) {
      for (const entry of storeEntries) {
        stores[storeName].add(entry);
      }
    }
  });
  return db;
};

describe(`DBWrapper`, function() {
  const sandbox = sinon.createSandbox();

  before(async function() {
    // This help when re-running the tests manually after a previous failure
    // where the database didn't get properly deleted.
    const db = await new DBWrapper('db', 1).open();
    await db.deleteDatabase();
  });

  afterEach(async function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it('sets instance values from the options', function() {
      const db = new DBWrapper('db', 1);

      expect(db._name).to.equal('db');
      expect(db._version).to.equal(1);
      expect(db._onupgradeneeded).to.be.undefined;
      expect(db._onversionchange).to.equal(DBWrapper.prototype._onversionchange);
    });

    it('lets you specify callbacks', function() {
      const onupgradeneeded = () => {};
      const onversionchange = () => {};

      const db = new DBWrapper('db', 1, {onupgradeneeded, onversionchange});

      expect(db._name).to.equal('db');
      expect(db._version).to.equal(1);
      expect(db._onupgradeneeded).to.equal(onupgradeneeded);
      expect(db._onversionchange).to.equal(onversionchange);
    });
  });

  describe(`open`, function() {
    it(`opens a new database connection`, async function() {
      const db = new DBWrapper('db', 1);
      expect(db._db).to.be.null;

      await db.open('db', 1);
      expect(db._db).to.be.instanceOf(IDBDatabase);

      await db.deleteDatabase();
    });

    it(`returns the instance for easier init + assignment`, async function() {
      const db = await new DBWrapper('db', 1).open();
      expect(db).to.be.instanceOf(DBWrapper);

      await db.deleteDatabase();
    });

    it(`runs the onupgradeneeded callback if specified`, async function() {
      const onupgradeneeded = sinon.spy();
      const db = await new DBWrapper('db', 1, {onupgradeneeded}).open();

      expect(onupgradeneeded.callCount).to.equal(1);
      expect(onupgradeneeded.calledWith(sinon.match({
        type: 'upgradeneeded',
      }))).to.be.true;

      await db.deleteDatabase();
    });

    it(`sets the onversionchange callback`, async function() {
      const onversionchange = () => {};
      const db = await new DBWrapper('db', 1, {onversionchange}).open();

      expect(db._db.onversionchange).to.equal(db._onversionchange);

      await db.deleteDatabase();
    });

    // Note: doesn't work in node
    it.skip(`throws if there's an error opening the connection`, async function() {
      const db = await new DBWrapper('db', 2).open();

      // Stop the event from bubbling to the global object
      // and firing the global onerror handler.
      // https://github.com/w3c/IndexedDB/issues/49
      sandbox.stub(self, 'onerror');

      const err = await catchAsyncError(new DBWrapper('db', 1).open());
      expect(err.message).to.match(/version/);

      await db.deleteDatabase();
    });

    it(`throws if blocked for more than the timeout period when openning`,
        async function() {
      // Lessen the open timeout to make the tests faster.
      sandbox.stub(DBWrapper.prototype, 'OPEN_TIMEOUT').value(100);

      // Open a connection and don't close it on version change.
      const db = await new DBWrapper('db', 1, {onversionchange: () => {}}).open();

      // Open a request for a new version with an old version still open.
      // This will be blocked since the older version is still open.
      const err = await catchAsyncError(new DBWrapper('db', 2).open());
      expect(err.message).to.match(/blocked/);

      await db.deleteDatabase();
    });

    it(`times out even in cases where the onblocked handler doesn't file`,
        async function() {
      // Lessen the open timeout to make the tests faster.
      sandbox.stub(DBWrapper.prototype, 'OPEN_TIMEOUT').value(100);

      // Open a connection and don't close it on version change.
      const db = await new DBWrapper('db', 1, {onversionchange: () => {}}).open();

      // Open two requests for newer versions while the old version is open.
      // The first request will received the `blocked` event, but the second
      // request will not received any event entil the first request is
      // processed. In the event that the first request never gets unblocked,
      // the second request will never get an event. This test asserts that
      // both requests reject after a timeout period.
      const err1 = await catchAsyncError(new DBWrapper('db', 2).open());
      const err2 = await catchAsyncError(new DBWrapper('db', 2).open());
      expect(err1.message).to.match(/blocked/);
      expect(err2.message).to.match(/blocked/);

      await db.deleteDatabase();
    });
  });

  describe(`get`, function() {
    it(`gets an entry from the object store for the passed key`,
        async function() {
      const db = await createAndPopulateTestDb();

      const user = await db.get('users', data.users[0].email);
      expect(user).to.deep.equal(data.users[0]);

      const post = await db.get('posts', 1); // From autoIncrement-ed key
      expect(post).to.deep.equal(data.posts[0]);

      const comment = await db.get('comments', 1); // From autoIncrement-ed key
      expect(comment).to.deep.equal(data.comments[0]);

      await db.deleteDatabase();
    });

    it(`returns undefined if no entry is found`, async function() {
      const db = await createAndPopulateTestDb();

      const user = await db.get('users', 'null@gmail.com');
      expect(user).to.be.undefined;

      await db.deleteDatabase();
    });
  });

  describe(`add`, function() {
    it(`adds an entry to an object store and returns the key`,
        async function() {
      const db = await createTestDb();

      // Test an entry with an explicit key.
      const userKey = await db.add('users', data.users[0]);
      expect(userKey).to.equal(data.users[0].email);

      // Test an entry in a store with auto-incrementing keys.
      const postKey = await db.add('posts', data.posts[0]);
      expect(postKey).to.equal(1);

      // Test adding more than one entry to the same store.
      const commentKey1 = await db.add('comments', data.comments[0]);
      const commentKey2 = await db.add('comments', data.comments[1]);
      expect(commentKey1).to.equal(1);
      expect(commentKey2).to.equal(2);

      await db.deleteDatabase();
    });

    it(`throws if a value already exists for the specified key`,
        async function() {
      const db = await createAndPopulateTestDb();

      expect(await catchAsyncError(db.add('users', data.users[0]))).to.be.ok;

      await db.deleteDatabase();
    });
  });

  describe(`put`, function() {
    it(`puts an entry to an object store and returns the key`,
        async function() {
      const db = await createTestDb();

      // Test an entry with an explicit key.
      const userKey = await db.put('users', data.users[0]);
      expect(userKey).to.equal(data.users[0].email);

      // Test an entry in a store with auto-incrementing keys.
      const postKey = await db.put('posts', data.posts[0]);
      expect(postKey).to.equal(1);

      // Test adding more than one entry to the same store.
      const commentKey1 = await db.put('comments', data.comments[0]);
      const commentKey2 = await db.put('comments', data.comments[1]);
      expect(commentKey1).to.equal(1);
      expect(commentKey2).to.equal(2);

      await db.deleteDatabase();
    });

    it(`overrides existing values for the specified key`, async function() {
      const db = await createAndPopulateTestDb();

      // Test an entry with an explicit key.
      const userData = await db.get('users', data.users[0].email);
      userData.lastName = 'Newman';

      const userKey = await db.put('users', userData);
      expect(userKey).to.equal(userData.email);

      const newUserData = await db.get('users', userData.email);
      expect(newUserData).to.deep.equal(userData);

      // Test an entry in a store with auto-incrementing keys.
      const postData = await db.get('posts', 1);
      postData.content = 'Some new content...';

      const postKey = await db.put('posts', postData, 1);
      expect(postKey).to.equal(1);

      const newPostData = await db.get('posts', 1);
      expect(newPostData).to.deep.equal(postData);

      await db.deleteDatabase();
    });
  });

  describe(`delete`, function() {
    it(`deletes an entry from an object store`, async function() {
      const db = await createAndPopulateTestDb();

      const users = await db.getAll('users');
      expect(users).to.deep.equal(data.users);

      await db.delete('users', data.users[0].email);

      const usersLeft = await db.getAll('users');
      expect(usersLeft).to.deep.equal(data.users.slice(1));

      await db.deleteDatabase();
    });
  });

  describe(`getAll`, function() {
    it(`returns all entries in an object store`, async function() {
      const db = await createAndPopulateTestDb();

      const users = await db.getAll('users');
      expect(users).to.deep.equal(data.users);

      const posts = await db.getAll('posts');
      expect(posts).to.deep.equal(data.posts);

      const comments = await db.getAll('comments');
      expect(comments).to.deep.equal(data.comments);

      await db.deleteDatabase();
    });

    it(`supports an optional query parameter`, async function() {
      const db = await createAndPopulateTestDb();

      const users1 = await db.getAll('users', IDBKeyRange.bound('a', 'm'));
      const users2 = await db.getAll('users', IDBKeyRange.bound('n', 'z'));

      expect(users1).to.deep.equal(data.users.slice(0, 2));
      expect(users2).to.deep.equal(data.users.slice(2));

      await db.deleteDatabase();
    });

    it(`supports an optional count parameter`, async function() {
      const db = await createAndPopulateTestDb();

      const users1 = await db.getAll('users', IDBKeyRange.bound('a', 'z'), 1);
      const users2 = await db.getAll('users', IDBKeyRange.bound('a', 'z'), 2);

      expect(users1).to.deep.equal(data.users.slice(0, 1));
      expect(users2).to.deep.equal(data.users.slice(0, 2));

      await db.deleteDatabase();
    });

    it(`uses a getAll polyfill when the native version isn't supported`,
        async function() {
      // Fake a browser without getAll support.
      const originalGetAll = IDBObjectStore.prototype.getAll;
      delete IDBObjectStore.prototype.getAll;

      const db = await createAndPopulateTestDb();

      const users1 = await db.getAll('users', IDBKeyRange.bound('a', 'm'));
      const users2 = await db.getAll('users', IDBKeyRange.bound('n', 'z'));

      expect(users1).to.deep.equal(data.users.slice(0, 2));
      expect(users2).to.deep.equal(data.users.slice(2));

      // Restore getAll.
      if (originalGetAll) {
        IDBObjectStore.prototype.getAll = originalGetAll;
      }

      await db.deleteDatabase();
    });
  });

  describe(`getAllKeys`, function() {
    it(`returns the keys of all entries in an object store`, async function() {
      const db = await createAndPopulateTestDb();

      const users = await db.getAllKeys('users');
      expect(users).to.deep.equal(data.users.map(({email}) => email));

      const posts = await db.getAllKeys('posts');
      expect(posts).to.deep.equal([1, 2, 3, 4, 5, 6]);

      const comments = await db.getAllKeys('comments');
      expect(comments).to.deep.equal([1, 2, 3, 4, 5]);

      await db.deleteDatabase();
    });

    it(`supports an optional query parameter`, async function() {
      const db = await createAndPopulateTestDb();

      const users1 = await db.getAllKeys('users', IDBKeyRange.bound('a', 'm'));
      const users2 = await db.getAllKeys('users', IDBKeyRange.bound('n', 'z'));

      expect(users1).to.deep.equal(
          data.users.slice(0, 2).map(({email}) => email));
      expect(users2).to.deep.equal(
          data.users.slice(2).map(({email}) => email));

      await db.deleteDatabase();
    });

    it(`supports an optional count parameter`, async function() {
      const db = await createAndPopulateTestDb();

      const users1 = await db.getAllKeys(
          'users', IDBKeyRange.bound('a', 'z'), 1);
      const users2 = await db.getAllKeys(
          'users', IDBKeyRange.bound('a', 'z'), 2);

      expect(users1).to.deep.equal(
          data.users.slice(0, 1).map(({email}) => email));
      expect(users2).to.deep.equal(
          data.users.slice(0, 2).map(({email}) => email));

      await db.deleteDatabase();
    });

    it(`uses a getAllKeys polyfill when the native version isn't supported`,
        async function() {
      // Fake a browser without getAllKeys support.
      const originalGetAllKeys = IDBObjectStore.prototype.getAllKeys;
      delete IDBObjectStore.prototype.getAllKeys;

      const db = await createAndPopulateTestDb();

      const users1 = await db.getAllKeys('users', IDBKeyRange.bound('a', 'm'));
      const users2 = await db.getAllKeys('users', IDBKeyRange.bound('n', 'z'));

      expect(users1).to.deep.equal(
          data.users.slice(0, 2).map(({email}) => email));
      expect(users2).to.deep.equal(
          data.users.slice(2).map(({email}) => email));

      // Restore getAllKeys.
      if (originalGetAllKeys) {
        IDBObjectStore.prototype.getAllKeys = originalGetAllKeys;
      }

      await db.deleteDatabase();
    });
  });

  describe(`getAllBy`, function() {
    it(`returns all entries in an object store by default`, async function() {
      const db = await createAndPopulateTestDb();

      const users = await db.getAllBy('users');
      expect(users).to.deep.equal(data.users);

      const posts = await db.getAllBy('posts');
      expect(posts).to.deep.equal(data.posts);

      const comments = await db.getAllBy('comments');
      expect(comments).to.deep.equal(data.comments);

      await db.deleteDatabase();
    });

    it(`accepts options to customize the results returned`, async function() {
      const db = await createAndPopulateTestDb();

      // Gets the most recent user added to the store.
      const [user] = await db.getAllBy('users', {
        count: 1,
        direction: 'prev',
      });
      const lastUser = data.users[2];
      expect(user).to.deep.equal(lastUser);

      // Gets all posts by the most recent user
      const posts = await db.getAllBy('posts', {
        index: 'userEmail',
        query: IDBKeyRange.only(lastUser.email),
      });
      // Should match the posts at these indexes.
      expect(posts[0]).to.deep.equal(data.posts[2]);
      expect(posts[1]).to.deep.equal(data.posts[3]);
      expect(posts[2]).to.deep.equal(data.posts[5]);

      // Gets the last comment from the first post, including keys
      const [comment] = await db.getAllBy('comments', {
        index: 'postId',
        query: IDBKeyRange.only(1),
        direction: 'prev',
        count: 1,
        includeKeys: true,
      });
      expect(comment.value).to.deep.equal(data.comments[1]);
      expect(comment.key).to.equal(data.comments[1].postId);
      expect(comment.primaryKey).to.equal(2);

      await db.deleteDatabase();
    });
  });

  describe(`transaction`, function() {
    it(`performs a transaction on the specified object stores`,
        async function() {
      const db = await createTestDb();

      await db.transaction(['users', 'posts'], 'readwrite', (stores) => {
        stores.users.add(data.users[0]);
        stores.posts.add(data.posts[0]);
      });

      const users = await db.getAll('users');
      const posts = await db.getAll('posts');

      expect(users).to.deep.equal(data.users.slice(0, 1));
      expect(posts).to.deep.equal(data.posts.slice(0, 1));

      await db.deleteDatabase();
    });

    it(`provides a 'complete' function to resolve a transaction with a value`,
        async function() {
      const db = await createAndPopulateTestDb();

      // Gets the most recent comment from a particular user
      const comment = await db.transaction(['comments'], 'readwrite',
          (stores, complete) => {
        const postIdIndex = stores.comments.index('userEmail');
        postIdIndex
            .openCursor(IDBKeyRange.only(data.users[0].email), 'prev')
            .onsuccess = (evt) => {
          const cursor = evt.target.result;
          complete(cursor ? cursor.value : null);
        };
      });
      expect(comment).to.deep.equal(data.comments[4]);

      await db.deleteDatabase();
    });

    it(`provides an 'abort' function to manually abort a transaction`,
        async function() {
      const db = await createTestDb();

      const err = await catchAsyncError(db.transaction(
          ['posts', 'comments'], 'readwrite', (stores, complete, abort) => {
        stores.posts.add(data.posts[0]).onsuccess = (evt) => {
          const postId = evt.target.result;
          stores.comments.add({postId}).onsuccess = (evt) => {
            // Abort if the new key is less than 10 (which should be true).
            if (evt.target.result < 10) {
              abort();
            }
          };
        };
      }));
      expect(err.message).to.match(/abort/);

      // Assert the added post and comment were rolled back.
      const posts = await db.getAll('posts');
      expect(posts).to.have.lengthOf(0);
      const comments = await db.getAll('comments');
      expect(comments).to.have.lengthOf(0);

      await db.deleteDatabase();
    });

    it(`throws if the transaction fails`, async function() {
      const db = await createAndPopulateTestDb();

      // Stop the event from bubbling to the global object
      // and firing the global onerror handler.
      // https://github.com/w3c/IndexedDB/issues/49
      // sandbox.stub(self, 'onerror');

      const err = await catchAsyncError(db.transaction(
          ['users'], 'readwrite', (stores) => {
        // This should fail because the key is already set.
        stores.users.add(data.users[0]);
      }));
      expect(err).to.have.property('message');

      await db.deleteDatabase();
    });
  });

  describe(`close`, function() {
    // TODO(philipwalton): shelving-mock-indexeddb doesn't define a prototype
    // for IDBDatabase, so we can't spy on it here, but this passes in
    // browser tests.
    it.skip(`closes a connection to a database`, async function() {
      sandbox.spy(IDBDatabase.prototype, 'close');

      const db = await createTestDb();
      await db.open();

      db.close();

      expect(IDBDatabase.prototype.close.calledOnce).to.be.true;

      await db.deleteDatabase();
    });
  });

  describe(`deleteDatabase`, function() {
    // TODO(philipwalton): shelving-mock-indexeddb defines deleteDatabase
    // as an non-writable property, so we can't spy on it, but this passes in
    // browser tests.
    it.skip(`deletes a database`, async function() {
      sandbox.spy(indexedDB, 'deleteDatabase');

      const db = await createTestDb();
      await db.deleteDatabase();

      expect(indexedDB.deleteDatabase.calledOnce).to.be.true;
    });

    it.skip(`throws when an error occurs`, async function() {
      const fakeError = new Error();
      sandbox.stub(indexedDB, 'deleteDatabase').callsFake(() => {
        const result = {};
        // Asynchronously call onerror.
        setTimeout(() => result.onerror({target: {error: fakeError}}), 0);
        return result;
      });

      const db = await createTestDb();
      const err = await catchAsyncError(db.deleteDatabase());
      expect(err).to.equal(fakeError);
    });
  });

  describe(`static onsuccessAll`, function() {
    it(`runs a callback once all requests have succeeded`,
        async function() {
      const db = await createAndPopulateTestDb();

      // Updates all comments from a particular user.
      const comments = await db.transaction(['comments'], 'readwrite',
          (stores, complete) => {
        const results = [];

        const postIdIndex = stores.comments.index('userEmail');
        const query = IDBKeyRange.only(data.users[0].email);
        postIdIndex.openCursor(query).onsuccess = (evt) => {
          const cursor = evt.target.result;
          if (cursor) {
            const {primaryKey, value} = cursor;
            results.push({primaryKey, value});

            // TODO(philipwalton): this update call breaks in Safari due to
            // non-unique cursors not iterating properly when there's an
            // update/delete call:
            // https://bugs.webkit.org/show_bug.cgi?id=178995
            // cursor.update(...);

            cursor.continue();
          } else {
            // Convert the text of all this user's comments to uppercase.
            const updateRequests = results.map(({primaryKey, value}) => {
              value.content = value.content.toUpperCase();
              return stores.comments.put(value, primaryKey);
            });
            DBWrapper.onsuccessAll(updateRequests, complete);
          }
        };
      });
      // Each request's result is the primary key of the entry updated.
      expect(comments).to.deep.equal([3, 4, 5]);

      await db.deleteDatabase();
    });
  });
});

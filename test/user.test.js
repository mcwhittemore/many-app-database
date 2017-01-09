'use strict';

const test = require('./');
const model = require('../')
test('adding a new user', function(t) {
  const db = model('test', test.config);
  db.getUser('new', function(err, old) {
    if (err) return t.end(err);
    t.deepEqual({}, old, 'should be an empty object');
    t.end();
  });
});

test('get what you set', function(t) {
  const db = model('test', test.config);
  db.updateUser('update', {name:'update'}, function(err) {
    db.getUser('update', function(err, user) {
      if (err) return t.end(err);
      t.deepEqual({name:'update'}, user, 'tracks adding attributes');
      t.end();
    });
  });
});

test('adding a new user adds to app data', function(t) {
  const db = model('test', test.config);
  db.getUser('new', function(err, old) {
    if (err) return t.end(err);
    db.getTodaysUsage(function(err, data) {
      if (err) return t.end(err);
      t.deepEqual({newUsers: 1, users: ['new'] }, data, 'returns expected numbers');
      t.end();
    });
  });
});

test('calling a user twice, only adds once', function(t) {
  const db = model('test', test.config);
  db.getUser('new', function(err) {
    if (err) return t.end(err);
    db.getUser('new', function(err) {
      if (err) return t.end(err);
      db.getTodaysUsage(function(err, data) {
        if (err) return t.end(err);
        t.deepEqual({newUsers: 1, users: ['new'] }, data, 'returns expected numbers');
        t.end();
      });
    });
  });
});

'use strict';

const AWS = require('aws-sdk');
const oneDay = 1000*60*60*24;

module.exports = function(appId, opts) {
  const config = { endpoint: opts.endpoint, region: opts.region };
  const dynamoDb = new AWS.DynamoDB.DocumentClient(config);

  let api = {};

  const today = Math.floor(Date.now()/oneDay);

  // track app / user / day
  // track app / day
  api.getUser = function(userId, callback) {
    const appTrack = ['track', appId, today].join('!');

    const update = {
      lastSeen: today
    };
    
    // update user's lastSeen to get user object
    api.updateUser(userId, update, function(err, old) {
      if (err) return callback(err);
      var attrs = old.Attributes || {};
      delete attrs.key;
      const lastSeen = attrs.lastSeen;
      delete attrs.lastSeen;
      if (lastSeen === today) return callback(null, attrs);
      
      // if lastSeen !== today, add user to app-today
      let appTodayParams = {
        TableName: opts.table,
        Key: { key: appTrack },
        ReturnValues: 'NONE',
        UpdateExpression: 'ADD #users :users',
        ExpressionAttributeValues: { ':users': dynamoDb.createSet([userId]) },
        ExpressionAttributeNames: { '#users': 'users' }
      };
      if (lastSeen === undefined) {
        appTodayParams.UpdateExpression += ', #newUsers :newUsers';
        appTodayParams.ExpressionAttributeNames['#newUsers'] = 'newUsers';
        appTodayParams.ExpressionAttributeValues[':newUsers'] = 1;
      }
      dynamoDb.update(appTodayParams, function(err) {
        if (err) return callback(err);
        callback(null, attrs);
      });
    });

  };

  api.updateUser = function(userId, update, callback) {
    const ids = Object.keys(update);

    const params = {
      TableName: opts.table,
      Key: { key: ['user', appId, userId].join('!') },
      ReturnValues: 'ALL_OLD',
      UpdateExpression: 'SET '+ids.map((id, i) => `#${i} = :${i}`).join(', '),
      ExpressionAttributeValues: ids.reduce((memo, id, i) => {
        memo[`:${i}`] = update[id];
        return memo;
      }, {}),
      ExpressionAttributeNames: ids.reduce((memo, id, i) => {
        memo[`#${i}`] = id;
        return memo;
      }, {})
    };

    dynamoDb.update(params, callback);
  };

  api.getTodaysUsage = function(callback) {
    api.getUsage(today, callback);      
  };

  api.getUsage = function(day, callback) {
    const appTrack = ['track', appId, day].join('!');
    const params = {
      TableName: opts.table,
      Key: { key: appTrack }
    };
    dynamoDb.get(params, function(err, data) {
      if (err) return callback(err);
      var item = data.Item || {};
      delete item.key;
      item.newUsers = item.newUsers || 0;
      item.users = item.users ? item.users.values : [];
      callback(null, item);
    });
  };

  return api;
};

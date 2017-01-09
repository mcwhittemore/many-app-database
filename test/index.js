const test = require('tape');
const Dyno = require('dyno');

const dynalite = require('dynalite')({
    createTableMs: 0,
    updateTableMs: 0,
    deleteTableMs: 0
});

const config = {
    region: 'us-east-1',
    endpoint: 'http://localhost:4567',
    table: 'test-table'
};

const schema = {
  'TableName': config.table,
  'ProvisionedThroughput': {
    'ReadCapacityUnits': 10,
    'WriteCapacityUnits': 10
  },
  'AttributeDefinitions': [
    {
      'AttributeName': 'key',
      'AttributeType': 'S'
    }
  ],
  'KeySchema': [
    {
      'AttributeName': 'key',
      'KeyType': 'HASH'
    }
  ]
};

const dyno = Dyno(config);

module.exports = function(name, callback) {
  test('start database', before);
  test(name, callback);
  test('stop dataset', after);
};

module.exports.config = config;

function before(t) {
  dynalite.listen(4567, function(err) {
    if (err) return t.end(err);
    dyno.createTable(schema, t.end.bind(t));
  });
};

function after(t) {
  dyno.deleteTable({ TableName: config.table }, function(err) {
    dynalite.close(function() {
      t.end(err);
    });
  });
};


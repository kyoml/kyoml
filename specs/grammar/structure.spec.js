const it        = require('ava');
const { dump }  = require('../utils')
const { parse } = require('../../grammar');


it('returns an object at the root', (t) => {
  const obj = parse(`
    key1 = 'value1'
    key2 = 'value2'
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'key1', type: 'RawString', value: 'value1' },
    { key: 'key2', type: 'RawString', value: 'value2' }
  ])
})

it('supports subblocks', (t) => {
  const obj = parse(`
    key = 'value'
  
    subblock {
      nestedkey = 'nestedvalue'
    }
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'key', type: 'RawString', value: 'value' },
    {
      key: 'subblock',
      type: 'Block',
      value: [{ key: 'nestedkey', type: 'RawString', value: 'nestedvalue' }]
    }
  ])
})

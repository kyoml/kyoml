const it        = require('ava');
const { dump }  = require('../utils')
const { parse } = require('../../grammar');


it('allows key/value pairs at the root', (t) => {
  const obj = parse(`
    key1 = 'value1'
    key2 = 'value2'
  `)


  t.deepEqual(obj.value, [
    { key: 'key1', type: 'RawString', value: 'value1' },
    { key: 'key2', type: 'RawString', value: 'value2' }
  ])
})

it('key value pairs must end with a line break', (t) => {
  t.throws(() => {
    parse(`
      key1 = 'value1' key2 = 'value2'
    `)
  });
})

it('supports subblocks', (t) => {
  const obj = parse(`
    key = 'value'
  
    subblock {
      nestedkey = 'nestedvalue'
    }
  `)


  t.deepEqual(obj.value, [
    { key: 'key', type: 'RawString', value: 'value' },
    {
      key: 'subblock',
      type: 'Block',
      value: [{ key: 'nestedkey', type: 'RawString', value: 'nestedvalue' }]
    }
  ])
})

it('subblocks must end with a line break', (t) => {
  t.throws(() => parse(`  
    subblock {
      nestedkey = 'nestedvalue'
    } key = 'value'
  `));
})


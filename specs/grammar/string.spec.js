const it        = require('ava');
const { parse } = require('../../grammar');

it('supports single quoted strings', (t) => {
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

it('supports double quoted strings', (t) => {
  const obj = parse(`
    key1 = "value1"
    key2 = "value2"
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'key1', type: 'ComplexString', value: 'value1' },
    { key: 'key2', type: 'ComplexString', value: 'value2' }
  ])
})
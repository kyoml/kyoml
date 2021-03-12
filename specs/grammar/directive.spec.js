const it        = require('ava');
const { dump }  = require('../utils')
const { parse } = require('../../grammar');

it('allows root directives (in the body of a block)', (t) => {
  const obj = parse(`
    @directive()

    key1 = 'value1'
    key2 = 'value2'
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'directive', type: 'Directive', args: [] },
    { key: 'key1', type: 'RawString', value: 'value1' },
    { key: 'key2', type: 'RawString', value: 'value2' }
  ])
})

it('allows directives without arguments', (t) => {
  const obj = parse(`
    @directive

    key1 = 'value1'
    key2 = 'value2'
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'directive', type: 'Directive', args: [] },
    { key: 'key1', type: 'RawString', value: 'value1' },
    { key: 'key2', type: 'RawString', value: 'value2' }
  ])
})

it('allows directives with arguments', (t) => {
  const obj = parse(`
    @directive("hello", 123, yes, [{ "a": 1 }])
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    {
      key: 'directive',
      type: 'Directive',
      args: [
        { type: 'ComplexString',  value: 'hello' },
        { type: 'Number',         value: 123 },
        { type: 'Boolean',        value: true },
        { 
          type: 'Array', value: [{
            type: 'Map', value: [{ key: 'a', type: 'Number', value: 1 }]
          }] 
        }
      ]
    }
  ])
})



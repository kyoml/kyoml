const it        = require('ava');
const { dump }  = require('../utils')
const { parse } = require('../../grammar');

it('supports arrays', (t) => {
  const obj = parse(`
    a = ["hello", 'hello', 123, true, [false], { "a": 1 }]
  `)

  t.deepEqual(obj.value, [{
      key: 'a',
      type: 'Array',
      value: [
        { type: 'ComplexString', value: 'hello' },
        { type: 'RawString', value: 'hello' },
        { type: 'Numeric', value: 123 },
        { type: 'Boolean', value: true },
        { type: 'Array', value: [ { type: 'Boolean', value: false } ] },
        { type: 'Map', value: [ { key: 'a', type: 'Numeric', value: 1 } ] }
      ]
    }])
});

it('supports multi-line arrays', (t) => {
  const obj = parse(`
    a = [
      "hello",
      'hello',
      123, true,
      [false],
      { "a": 1 }
    ]
  `)

  t.deepEqual(obj.value, [{
      key: 'a',
      type: 'Array',
      value: [
        { type: 'ComplexString', value: 'hello' },
        { type: 'RawString', value: 'hello' },
        { type: 'Numeric', value: 123 },
        { type: 'Boolean', value: true },
        { type: 'Array', value: [ { type: 'Boolean', value: false } ] },
        { type: 'Map', value: [ { key: 'a', type: 'Numeric', value: 1 } ] }
      ]
    }])
});

it('supports empty arrays', (t) => {
  const obj = parse(`
    a = []
  `)

  t.deepEqual(obj.value, [{
    key: 'a',
    type: 'Array',
    value: []
  }])
});

it('requires commas between values', (t) => {
  t.throws(() => parse(`
    a = [1 2 3]
  `))

});

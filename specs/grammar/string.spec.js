const it        = require('ava');
const { parse } = require('../../grammar');

it('supports single quoted strings', (t) => {
  const obj = parse(`
    key1 = 'value1'
    key2 = 'value2'
  `)

  t.deepEqual(obj.value, [
    { key: 'key1', type: 'RawString', value: 'value1' },
    { key: 'key2', type: 'RawString', value: 'value2' }
  ])
})

it('supports double quoted strings', (t) => {
  const obj = parse(`
    key1 = "value1"
    key2 = "value2"
  `)

  t.deepEqual(obj, {
    type: 'Block',
    value: [
      { key: 'key1', type: 'ComplexString', value: 'value1' },
      { key: 'key2', type: 'ComplexString', value: 'value2' }
    ]
  })
})

it('supports escaped characters', (t) => {
  const obj = parse(`
    key1 = 'first line\\n second line'
    key2 = 'this character: \\' is a quote'
    key3 = "this character: \\" is a double quote"
  `)

  t.deepEqual(obj.value, [
    { key: 'key1', type: 'RawString', value: 'first line\n second line' },
    { key: 'key2', type: 'RawString', value: "this character: ' is a quote" },
    { key: 'key3', type: 'ComplexString', value: 'this character: " is a double quote' },
  ])
})

it('supports unicode characters', (t) => {
  const obj = parse(`
    key1 = 'enchant\\u00E9'
  `)

  t.deepEqual(obj.value, [
    { key: 'key1', type: 'RawString', value: 'enchanté' },
  ])
})

it('does not support single quoted multi-line strings', (t) => {
  t.throws(() => {
    parse(`
      key1 = 'hello
      world'
    `)
  });
})

it('does not support double quoted multi-line strings', (t) => {
  t.throws(() => {
    parse(`
      key1 = "hello
      world"
    `)
  });
})

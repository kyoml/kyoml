const it        = require('ava');
const { parse } = require('../../dist/index');

it('adds subblocks as a nested object', (t) => {
  const obj = parse(`
    sublock {}
  `)

  t.deepEqual(obj, {
    sublock: {}
  })
})

it('normalizes strings', (t) => {
  const obj = parse(`
    a = 'foo'
    b = "bar"
  `)

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar'
  })
})

it('normalizes numbers', (t) => {
  const obj = parse(`
    a = 987
    b = 111.980
  `)

  t.deepEqual(obj, {
    a: 987,
    b: 111.98
  })
})

it('normalizes booleans', (t) => {
  const obj = parse(`
    a = yes
    b = true
    c = no
    d = false
  `)

  t.deepEqual(obj, {
    a: true,
    b: true,
    c: false,
    d: false
  })
})

it('normalizes arrays', (t) => {
  const obj = parse(`
    a = [1, "hello", yes]
  `)

  t.deepEqual(obj, {
    a: [1, "hello", true]
  })
})

it('normalizes objects', (t) => {
  const obj = parse(`
    a = {
      "hello": "world",
      "foo": {
        "value": ["bar"]
      }
    }
  `)

  t.deepEqual(obj, {
    a: {
      hello: 'world',
      foo: {
        value: ['bar']
      }
    }
  })
})




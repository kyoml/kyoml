const it        = require('ava');
const { parse } = require('../../index');

it('only interpolates complex string', (t) => {
  const obj = parse(`
    a = 'foo'
    b = '\${a}'
    c = "\${a}"
  `)

  t.deepEqual(obj, {
    a: 'foo',
    b: '${a}',
    c: 'foo'
  })
})

it('supports multi-level interpolation', (t) => {
  const obj = parse(`
    a = 'foo'
    b = "foo \${a}"
    c = "\${b} foo \${b}"
  `)

  t.deepEqual(obj, {
    a: 'foo',
    b: 'foo foo',
    c: 'foo foo foo foo foo'
  })
})

it('detects circular interpolation', (t) => {
  const e = t.throws(() => parse(`
    a = 'foo'
    b = "\${c}"
    c = "foo \${b}"
  `))

  t.is(e.message, 'Circular interpolation detected -> c -> b -> c')
})

it('interpolates strings in arrays', (t) => {
  const obj = parse(`
    a = 'foo'
    b = ["\${a}"]
  `)

  t.deepEqual(obj, {
    a: 'foo',
    b: ['foo']
  })
})

it('interpolation can fetch array keys by index', (t) => {
  const obj = parse(`
    a = ['foo', 'bar']
    secondElement = "\${a[1]}"
  `)

  t.deepEqual(obj, {
    a: ['foo', 'bar'],
    secondElement: 'bar'
  })
})

it('interpolation is supported in directive arguments', (t) => {
  const obj = parse(`
    @test("\${a} \${b}")

    a = 'hello'
    b = 'world'
  `, {
    directives: {
      test: (v, str) => ({ ...v, c: str})
    }
  })

  t.deepEqual(obj, {
    a: 'hello',
    b: 'world',
    c: 'hello world'
  })
})

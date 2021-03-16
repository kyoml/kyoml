const it        = require('ava');
const { parse } = require('../../dist/index');

it('disables string interpolation with interpolate=false', (t) => {
  const obj = parse(`
    a = 'foo'
    b = '\${a}'
    c = "\${a}"
  `, { interpolate: false })

  t.deepEqual(obj, {
    a: 'foo',
    b: '${a}',
    c: '${a}'
  })
})


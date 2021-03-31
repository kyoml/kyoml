const it          = require('ava');
const { compile } = require('../../index');

it('disables string interpolation with interpolate=false', (t) => {
  const obj = compile(`
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


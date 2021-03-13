const it        = require('ava');
const { parse } = require('../../dist/index');

it('disables string interpolation with postProcess=false', (t) => {
  const obj = parse(`
    a = 'foo'
    b = '\${a}'
    c = "\${a}"
  `, { postProcess: false })

  t.deepEqual(obj, {
    a: 'foo',
    b: '${a}',
    c: '${a}'
  })
})


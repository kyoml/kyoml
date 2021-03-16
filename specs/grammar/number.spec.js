const it        = require('ava');
const { parse } = require('../../grammar');

it('supports integers', (t) => {
  const obj = parse(`
    num = 123
  `)

  t.deepEqual(obj.value, [
    { key: 'num', type: 'Numeric', value: 123 }
  ])
})

it('supports floating points', (t) => {
  const obj = parse(`
    num = 0.1
    num2 = 1923.1230
  `)

  t.deepEqual(obj.value, [
    { key: 'num', type: 'Numeric', value: 0.1 },
    { key: 'num2', type: 'Numeric', value: 1923.123 },
  ])
})


it('supports Numericwithout whole Numeric', (t) => {
  const obj = parse(`
    num = .1
  `)

  t.deepEqual(obj.value, [
    { key: 'num', type: 'Numeric', value: 0.1 }
  ])
})

it('doesnt supports commas in whole Numeric', (t) => {
  t.throws(() => parse(`
    num = 1923,1311.1230
  `))
})

it('rejects invalid Numeric', (t) => {
  t.throws(() => parse(`
    num = 19231.311.1230
  `))
})



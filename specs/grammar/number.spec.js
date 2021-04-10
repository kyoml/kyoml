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

it('supports negative numbers', (t) => {
  const obj = parse(`
    num = -0.1
    num2 = -1923.1230
    num3 = -2
  `)

  t.deepEqual(obj.value, [
    { key: 'num', type: 'Numeric', value: -0.1 },
    { key: 'num2', type: 'Numeric', value: -1923.123 },
    { key: 'num3', type: 'Numeric', value: -2 },
  ])
})

it('supports hexadecimal numbers', (t) => {
  const obj = parse(`
    num = 0xDEADBEEF
    num2 = -0xFFFFffff
    num3 = -   0xee
  `)

  t.deepEqual(obj.value, [
    { key: 'num', type: 'Numeric', value: 3735928559 },
    { key: 'num2', type: 'Numeric', value: -4294967295 },
    { key: 'num3', type: 'Numeric', value: -238 }
  ])
})

it('supports octal numbers', (t) => {
  const obj = parse(`
    num = 0o01234567
    num2 = -0o0234
    num3 = -   0o16
  `)

  t.deepEqual(obj.value, [
    { key: 'num', type: 'Numeric', value: 342391 },
    { key: 'num2', type: 'Numeric', value: -156 },
    { key: 'num3', type: 'Numeric', value: -14 }
  ])
})

it('supports binary numbers', (t) => {
  const obj = parse(`
    num = 0b11010110
    num2 = -0b1111111
    num3 = -   0b1111111010101
  `)

  t.deepEqual(obj.value, [
    { key: 'num', type: 'Numeric', value: 214 },
    { key: 'num2', type: 'Numeric', value: -127 },
    { key: 'num3', type: 'Numeric', value: -8149 }
  ])
})

it('supports exponents', (t) => {
  const obj = parse(`
    num = 2E-2
    num2 = -2E+2
    num3 = -   4.5e20
  `)

  t.deepEqual(obj.value, [
    { key: 'num', type: 'Numeric', value: 0.02 },
    { key: 'num2', type: 'Numeric', value: -200 },
    { key: 'num3', type: 'Numeric', value: -450000000000000000000 }
  ])
})

it('supports Numerics without whole Numeric', (t) => {
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



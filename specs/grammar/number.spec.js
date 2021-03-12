const it        = require('ava');
const { parse } = require('../../grammar');

it('supports integers', (t) => {
  const obj = parse(`
    num = 123
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'num', type: 'Number', value: 123 }
  ])
})

it('supports floating points', (t) => {
  const obj = parse(`
    num = 0.1
    num2 = 1923.1230
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'num', type: 'Number', value: 0.1 },
    { key: 'num2', type: 'Number', value: 1923.123 },
  ])
})

it('supports commas in whole number', (t) => {
  const obj = parse(`
    num = 1923,1311.1230
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'num', type: 'Number', value: 19231311.123 },
  ])
})

it('rejects commas in fraction', (t) => {
  t.throws(() =>{
    parse(`
      num = 1.123,121
    `)
  });
})


const it        = require('ava');
const { dump }  = require('../utils')
const { parse } = require('../../grammar');

it('allows true', (t) => {
  const obj = parse(`
    a = true
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'a', type: 'Boolean', value: true }
  ])
})

it('allows false', (t) => {
  const obj = parse(`
    a = false
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'a', type: 'Boolean', value: false }
  ])
})

it('allows yes', (t) => {
  const obj = parse(`
    a = yes
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'a', type: 'Boolean', value: true }
  ])
})

it('allows no', (t) => {
  const obj = parse(`
    a = no
  `)

  t.is(Array.isArray(obj), true);
  t.deepEqual(obj, [
    { key: 'a', type: 'Boolean', value: false }
  ])
})

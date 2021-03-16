const it        = require('ava');
const { dump }  = require('../utils')
const { parse } = require('../../grammar');

it('allows true', (t) => {
  const obj = parse(`
    a = true
  `)


  t.deepEqual(obj.value, [
    { key: 'a', type: 'Boolean', value: true }
  ])
})

it('allows false', (t) => {
  const obj = parse(`
    a = false
  `)


  t.deepEqual(obj.value, [
    { key: 'a', type: 'Boolean', value: false }
  ])
})

it('allows yes', (t) => {
  const obj = parse(`
    a = yes
  `)


  t.deepEqual(obj.value, [
    { key: 'a', type: 'Boolean', value: true }
  ])
})

it('allows no', (t) => {
  const obj = parse(`
    a = no
  `)


  t.deepEqual(obj.value, [
    { key: 'a', type: 'Boolean', value: false }
  ])
})

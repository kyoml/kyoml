const it        = require('ava');
const { parse } = require('../../grammar');

it('supports comments after a key/value pair', (t) => {
  const obj = parse(`
    
    key1 = 'value1', # this is a comment
    key2 = 'value2'  # this is another
  `)

  t.deepEqual(obj.value, [
    { key: 'key1', type: 'RawString', value: 'value1' },
    { key: 'key2', type: 'RawString', value: 'value2' }
  ])
})

it('supports comments on empty lines', (t) => {
  const obj = parse(`
    # this is a comment
    # this is a another
    # 
    ###
    # # # Comment # # #
    key1 = 'value1'
    key2 = 'value2'
  `)

  t.deepEqual(obj.value, [
    { key: 'key1', type: 'RawString', value: 'value1' },
    { key: 'key2', type: 'RawString', value: 'value2' }
  ])
})

it('supports comments after a block ending', (t) => {
  const obj = parse(`
    sublock {
      a = 1
    } # oh yes !
  `)

  t.deepEqual(obj.value, [
    { key: 'sublock', type: 'Block', value: [
      { key: 'a', type: 'Numeric', value: 1 }
    ]}
  ])
})

it('supports comments within a multiline-array', (t) => {
  const obj = parse(`
    sublock = [ # comment
      1, # comment
      2, 3, # comment
      4 # comment
    ] # comment
  `)

  t.deepEqual(obj.value, [
    { key: 'sublock', type: 'Array', value: [
      { type: 'Numeric', value: 1 },
      { type: 'Numeric', value: 2 },
      { type: 'Numeric', value: 3 },
      { type: 'Numeric', value: 4 }
    ]}
  ])
})

it('supports comments within a Map', (t) => {
  const obj = parse(`
    sublock = { # comment
      "a": 1, # comment
      "b": 2, "c": 3, # comment
      "d": 4 # comment
    } # comment
  `)

  t.deepEqual(obj.value, [
    { key: 'sublock', type: 'Map', value: [
      { key: "a", type: 'Numeric', value: 1 },
      { key: "b", type: 'Numeric', value: 2 },
      { key: "c", type: 'Numeric', value: 3 },
      { key: "d", type: 'Numeric', value: 4 }
    ]}
  ])
})

it('allows comments in multiline assignments', (t) => {
  const obj = parse(`
    a = # this is a comment
      2
    b = 3
  `)

  t.deepEqual(obj.value, [
    { key: 'a', type: 'Numeric', value: 2 },
    { key: 'b', type: 'Numeric', value: 3 }
  ])
})


it('ignore hash symbols in arrays', (t) => {
  const obj = parse(`
    a = '# this is not a comment' # this is a comment
  `)

  t.deepEqual(obj.value, [
    { key: 'a', type: 'RawString', value: '# this is not a comment' }
  ])
})




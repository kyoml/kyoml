const it        = require('ava');
const { dump }  = require('../utils')
const { parse } = require('../../grammar');

it('allows root directives (in the body of a block)', (t) => {
  const obj = parse(`
    @directive()

    key1 = 'value1'
    key2 = 'value2'
  `)

  t.deepEqual(obj, {
    type:'Block',
    value: [
      { key: 'directive', type: 'Directive', args: [] },
      { key: 'key1', type: 'RawString', value: 'value1' },
      { key: 'key2', type: 'RawString', value: 'value2' }
    ]
  })
})

it('allows directives without arguments', (t) => {
  const obj = parse(`
    @directive

    key1 = 'value1'
    key2 = 'value2'
  `)

  t.deepEqual(obj, {
    type:'Block',
    value: [
      { key: 'directive', type: 'Directive', args: [] },
      { key: 'key1', type: 'RawString', value: 'value1' },
      { key: 'key2', type: 'RawString', value: 'value2' }
    ]
  })
})

it('allows directives with arguments', (t) => {
  const obj = parse(`
    @directive("hello", yes, 123, [{ "a": 1 }])
  `)

  t.deepEqual(obj, {
    type:'Block',
    value: [
      {
        key: 'directive',
        type: 'Directive',
        args: [
          { type: 'ComplexString',  value: 'hello' },
          { type: 'Boolean',        value: true },
          { type: 'Numeric',         value: 123 },
          { 
            type: 'Array', value: [{
              type: 'Map', value: [{ key: 'a', type: 'Numeric', value: 1 }]
            }] 
          }
        ]
      }
    ]
  })
})

it('allows right-piping values into a directive', (t) => {
  const obj = parse(`
    key = "some value" |> @func
  `)

  t.deepEqual(obj, {
    type:'Block',
    value: [
      {
        key: 'key',
        type: 'ComputedValue',
        value: {
          raw: {
            type: 'ComplexString',
            value: 'some value'
          },
          directives: [{ key: 'func', args: [], type: 'Directive' }]
        }
      }
    ]
  })
})

it('allows right-piping values into multiple directives', (t) => {
  const obj = parse(`
    key = "some value" |> @func |> @func2("hello")
  `)

  t.deepEqual(obj, {
    type:'Block',
    value: [
      {
        key: 'key',
        type: 'ComputedValue',
        value: {
          raw: {
            type: 'ComplexString',
            value: 'some value'
          },
          directives: [
            { key: 'func', args: [], type: 'Directive' },
            { key: 'func2', args: [{ type: 'ComplexString', value: 'hello' }], type: 'Directive' }
          ]
        }
      }
    ]
  })
})

it('allows multi-line piping', (t) => {
  const obj = parse(`
    key = [
      "this",
      "is",
      "an",
      "array"
    ]
    |> @func 
    |> @func2("hello")
  `)

  t.deepEqual(obj, {
    type:'Block',
    value: [
      {
        key: 'key',
        type: 'ComputedValue',
        value: {
          raw: {
            type: 'Array',
            value: [
              { type: 'ComplexString', value: 'this' },
              { type: 'ComplexString', value: 'is' },
              { type: 'ComplexString', value: 'an' },
              { type: 'ComplexString', value: 'array' }
            ]
          },
          directives: [
            { key: 'func', args: [], type: 'Directive' },
            { key: 'func2', args: [{ type: 'ComplexString', value: 'hello' }], type: 'Directive' }
          ]
        }
      }
    ]
  })
})

it('allows left-piping values into directives', (t) => {
  const obj = parse(`
    key = @func2(1) <| @func <| "some value"
  `)

  t.deepEqual(obj, {
    type:'Block',
    value: [
      {
        key: 'key',
        type: 'ComputedValue',
        value: {
          raw: {
            type: 'ComplexString',
            value: 'some value'
          },
          directives: [
            { key: 'func', args: [], type: 'Directive' },
            { key: 'func2', args: [{type: 'Numeric', value: 1}], type: 'Directive' }
          ]
        }
      }
    ]
  })
})


it('allows multi-line left-piping values into directives', (t) => {
  const obj = parse(`
    key = @func2(1) 
      <| @func 
      <| {
        "a": 1,
        "b": 2
      }
  `)

  t.deepEqual(obj, {
    type:'Block',
    value: [
      {
        key: 'key',
        type: 'ComputedValue',
        value: {
          raw: {
            type: 'Map',
            value: [
              { key: 'a', type: 'Numeric', value: 1 },
              { key: 'b', type: 'Numeric', value: 2 }
            ]
          },
          directives: [
            { key: 'func', args: [], type: 'Directive' },
            { key: 'func2', args: [{type: 'Numeric', value: 1}], type: 'Directive' }
          ]
        }
      }
    ]
  })
})



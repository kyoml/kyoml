const it                      = require('ava');
const { parse, SyntaxError }  = require('../../grammar');

it('supports maps', (t) => {
  const obj = parse(`
    key = {
      "foo": 'bar',
      "truth": true
    }
  `)

  t.deepEqual(obj, [
    {
      key: 'key',
      type: 'Map',
      value: [
        { key: 'foo', type: 'RawString', value: 'bar' },
        { key: 'truth', type: 'Boolean', value: true }
      ]
    }
  ])
});


it('allows single quoted strings', (t) => {
  const obj = parse(`
    key = {
      'foo': 'bar',
      "truth": true
    }
  `)

  t.deepEqual(obj, [
    {
      key: 'key',
      type: 'Map',
      value: [
        { key: 'foo', type: 'RawString', value: 'bar' },
        { key: 'truth', type: 'Boolean', value: true }
      ]
    }
  ])
});


it('allows empty maps', (t) => {
  const obj = parse(`
    key = {}
  `)

  t.deepEqual(obj, [
    {
      key: 'key',
      type: 'Map',
      value: []
    }
  ])
});

it('allows sub-maps as values', (t) => {
  const obj = parse(`
    obj = {
      "nested": {
        "foo": "bar"
      }
    }
  `)

  t.deepEqual(obj, [
    {
      key: 'obj',
      type: 'Map',
      value: [{
        key: 'nested',
        type: 'Map',
        value: [{
          key: 'foo',
          type: 'ComplexString',
          value: 'bar'
        }]
      }]
    }
  ])
});

it('requires a comma separator', (t) => {
  t.throws(() => {
		parse(`
      key = {
        'foo': 'bar'
        "truth": true
      }
    `)
	}, {instanceOf: SyntaxError});
});

it('forbids the use of the equal sign as assignment operator', (t) => {
  t.throws(() => {
		parse(`
      key = {
        'foo'= 'bar',
        "truth": true
      }
    `)
	}, {instanceOf: SyntaxError});
});

const it          = require('ava');
const { compile } = require('../../index');

it('values can be right-piped into directives', (t) => {
  const obj = compile(`
    a = 4 |> @double
  `, {
    directives: {
      double: ({ value, set }) => {
        set(value * 2);
      }
    }
  })

  t.deepEqual(obj, {
    a: 8
  })
})

it('values can be right-piped into mappers', (t) => {
  const obj = compile(`
    a = 4 |> @double
  `, {
    mappers: {
      double: v => v * 2
    }
  })

  t.deepEqual(obj, {
    a: 8
  })
})

it('values can be left-piped into directives', (t) => {
  const obj = compile(`
    a = @double <| 4
  `, {
    directives: {
      double: ({ value, set }) => {
        set(value * 2);
      }
    }
  })

  t.deepEqual(obj, {
    a: 8
  })
})

it('values can be left-piped into mappers', (t) => {
  const obj = compile(`
    a = @double <| 4
  `, {
    mappers: {
      double: v => v * 2
    }
  })

  t.deepEqual(obj, {
    a: 8
  })
})

it('values can be right-piped into directives with arguments', (t) => {
  const obj = compile(`
    a = 4 |> @mul(2, 3)
  `, {
    directives: {
      mul: ({ value, set }, n1, n2) => {
        set(value * n1 * n2)
      }
    }
  })

  t.deepEqual(obj, {
    a: 24
  })
})

it('values can be right-piped into mappers with arguments', (t) => {
  const obj = compile(`
    a = 4 |> @mul(2, 3)
  `, {
    mappers: {
      mul: (v, n1, n2) => v * n1 * n2
    }
  })

  t.deepEqual(obj, {
    a: 24
  })
})

it('values can be left-piped into directives with arguments', (t) => {
  const obj = compile(`
    a = @mul(2, 3) <| 4
  `, {
    directives: {
      mul: ({ value, set }, n1, n2) => {
        set(value * n1 * n2)
      }
    }
  })

  t.deepEqual(obj, {
    a: 24
  })
})

it('values can be left-piped into mappers with arguments', (t) => {
  const obj = compile(`
    a = @mul(2, 3) <| 4
  `, {
    mappers: {
      mul: (v, n1, n2) => v * n1 * n2
    }
  })

  t.deepEqual(obj, {
    a: 24
  })
})

it('values can be right-piped into multiple directives', (t) => {
  const obj = compile(`
    a = 4 |> @double |> @add(1)
  `, {
    directives: {
      double: ({ value, set }) => set(value * 2),
      add: ({ value, set }, n) => set(value + n)
    }
  })

  t.deepEqual(obj, {
    a: 9
  })
})

it('values can be right-piped into multiple mappers', (t) => {
  const obj = compile(`
    a = 4 |> @double |> @add(1)
  `, {
    mappers: {
      double: (v) => v * 2,
      add: (v, n) => v + n
    }
  })

  t.deepEqual(obj, {
    a: 9
  })
})

it('values can be left-piped into multiple directives', (t) => {
  const obj = compile(`
    a = @add(1) <| @double <| 4
  `, {
    directives: {
      double: ({ value, set }) => set(value * 2),
      add: ({ value, set }, n) => set(value + n)
    }
  })

  t.deepEqual(obj, {
    a: 9
  })
})

it('values can be left-piped into multiple mappers', (t) => {
  const obj = compile(`
    a = @add(1) <| @double <| 4
  `, {
    mappers: {
      double: (v) => v * 2,
      add: (v, n) => v + n
    }
  })

  t.deepEqual(obj, {
    a: 9
  })
})

it('complex pipes example', (t) => {
  const obj = compile(`
    @extend

    a = [@extend <| { "num": @double <| @max <| [2,1,-1,0.1] }]
  `, {
    mappers: {
      double: (v) => v * 2,
      max: (arr) => Math.max(...arr),
      extend: (v) => ({ ...v, foo: 'bar' })
    }
  })

  t.deepEqual(obj, {
    foo: 'bar',
    a: [{
      num: 4,
      foo: 'bar'
    }]
  })
})

it('prevents piping in both directions on the same value', (t) => {
  t.throws(() => compile(`
    a = @double <| 4 |> @double
  `, {
    mappers: {
      double: (v) => v * 2
    }
  }));
})






const it        = require('ava');
const { parse } = require('../../dist/index');

it('applies root directives to entire the block', (t) => {
  let arg = null;

  const obj = parse(`
    @test()

    a = 'foo'
    b = 'bar'
  `, {
    directives: {
      test: (v) => arg = v
    }
  })

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar'
  })

  t.is(arg, obj)
})

it('returns a modified version of the block', (t) => {
  const obj = parse(`
    @test()

    a = 'foo'
    b = 'bar'
  `, {
    directives: {
      test: (v) => ({ ...v, c: 'hello' })
    }
  })

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar',
    c: 'hello'
  })
})

it('supports directive arguments', (t) => {
  const obj = parse(`
    @test("hello")

    a = 'foo'
    b = 'bar'
  `, {
    directives: {
      test: (v, str) => ({ ...v, c: str})
    }
  })

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar',
    c: 'hello'
  })
})

it('calls the directives in order of appearance', (t) => {
  const obj = parse(`
    @test(1)
    @test(2)
    @test(3)
    @test(4)
    @test(5)

    a = 'foo'
    b = 'bar'
    c = []
  `, {
    directives: {
      test: (v, n) => ({
        ...v,
        c: [...v.c, n]
      })
    }
  })

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar',
    c: [1,2,3,4,5]
  })
})

it('supports directives in sub-blocks', (t) => {
  const obj = parse(`
    @test('bar')

    nested {
      @test('barrr')

      hello = 'world'
    }

    a = 1
    b = 2
    
  `, {
    directives: {
      test: (v, s) => ({
        ...v,
        foo: s
      })
    }
  })

  t.deepEqual(obj, {
    a: 1,
    b: 2,
    foo: 'bar',
    nested: {
      hello: 'world',
      foo: 'barrr'
    }
  })
})

it('directives in sub-blocks are processed first', (t) => {
  let i = 0;
  const obj = parse(`
    @test()
    nested {
      @test()
    }    
  `, {
    directives: {
      test: (v) => ({
        ...v,
        foo: ++i
      })
    }
  })

  t.deepEqual(obj, {
    foo: 2,
    nested: {
      foo: 1
    }
  })
})







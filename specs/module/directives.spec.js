const it = require('ava');
const { compile } = require('../../index');

it('receives a node object as first argument', t => {
  let arg = null;

  const obj = compile(
    `
    @test()

    a = 'foo'
    b = 'bar'
  `,
    {
      directives: {
        test: v => (arg = v)
      }
    }
  );

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar'
  });

  t.is(typeof arg.root, 'object');
  t.is(typeof arg.path, 'string');
  t.is(typeof arg.base, 'object');
  t.is(typeof arg.key, 'string');
});

it('applies root directives to entire the block', t => {
  let arg = null;

  const obj = compile(
    `
    @test()

    a = 'foo'
    b = 'bar'
  `,
    {
      directives: {
        test: ({ value }) => (arg = value)
      }
    }
  );

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar'
  });

  t.is(arg, obj);
});

it('applies root mappers to entire the block', t => {
  let arg = null;

  const obj = compile(
    `
    @test()

    a = 'foo'
    b = 'bar'
  `,
    {
      mappers: {
        test: v => {
          arg = v;
          return v;
        }
      }
    }
  );

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar'
  });

  t.is(arg, obj);
});

it('mappers return an alternatve value for the block', t => {
  const obj = compile(
    `
    @test()

    a = 'foo'
    b = 'bar'
  `,
    {
      mappers: {
        test: v => ({ ...v, c: 'hello' })
      }
    }
  );

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar',
    c: 'hello'
  });
});

it('supports directive arguments', t => {
  const obj = compile(
    `
    @test("hello")

    a = 'foo'
    b = 'bar'
  `,
    {
      directives: {
        test: ({ value, set }, str) => set({ ...value, c: str })
      }
    }
  );

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar',
    c: 'hello'
  });
});

it('supports mappers arguments', t => {
  const obj = compile(
    `
    @test("hello")

    a = 'foo'
    b = 'bar'
  `,
    {
      mappers: {
        test: (v, str) => ({ ...v, c: str })
      }
    }
  );

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar',
    c: 'hello'
  });
});

it('calls the directives in order of appearance', t => {
  const obj = compile(
    `
    @test(1)
    @test(2)
    @test(3)
    @test(4)
    @test(5)

    a = 'foo'
    b = 'bar'
    c = []
  `,
    {
      mappers: {
        test: (v, n) => ({
          ...v,
          c: [...v.c, n]
        })
      }
    }
  );

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar',
    c: [1, 2, 3, 4, 5]
  });
});

it('supports directives in sub-blocks', t => {
  const obj = compile(
    `
    @test('bar')

    nested {
      @test('barrr')

      hello = 'world'
    }

    a = 1
    b = 2
    
  `,
    {
      directives: {
        test: ({ value, set }, s) =>
          set({
            ...value,
            foo: s
          })
      }
    }
  );

  t.deepEqual(obj, {
    a: 1,
    b: 2,
    foo: 'bar',
    nested: {
      hello: 'world',
      foo: 'barrr'
    }
  });
});

it('directives in sub-blocks are processed first', t => {
  let i = 0;
  const obj = compile(
    `
    @test()
    nested {
      @test()
    }    
  `,
    {
      mappers: {
        test: v => ({
          ...v,
          foo: ++i
        })
      }
    }
  );

  t.deepEqual(obj, {
    foo: 2,
    nested: {
      foo: 1
    }
  });
});

it('doest not allow directives in maps', t => {
  t.throws(() =>
    compile(
      `
    @test()
    "nested" = {
      @test()

      "a": 2
    }    
  `,
      {
        directives: {
          test: v => v
        }
      }
    )
  );
});

it('throws if directive have not been provided', t => {
  t.throws(() =>
    compile(`
      block {
        @unknownDirective()
      }    
    `)
  );
});

it('throws if a directive and mapper key conflicts', t => {
  t.throws(() =>
    compile(
      `
    block {
      @hello()
    }    
  `,
      {
        directives: { hello() {} },
        mappers: {
          hello() {
            1;
          }
        }
      }
    )
  );
});

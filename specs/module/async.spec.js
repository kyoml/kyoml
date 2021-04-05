const it = require('ava');
const { compile } = require('../../index');

const delayed = (val) => new Promise(done => {
  setTimeout(() => done(val), 5);
})

it('throws if a directive is async when async mode is turned off', (t) => {
  t.throws(() => compile(
    `
    @test()

    a = 'foo'
    b = 'bar'
  `,
    {
      directives: {
        test: async ({ value }) => {
          value['hello'] = await delayed('world')
        }
      }
    }
  ), { message: 'Async directive test used outside of async mode' });
});

it('allows async directives when async mode is turned on', async (t) => {
  const obj = await compile(
    `
    @test()

    a = 'foo'
    b = 'bar'
  `,
    {
      async: true,
      directives: {
        test: async ({ value }) => {
          value['hello'] = await delayed('world')
        }
      }
    }
  );

  t.deepEqual(obj, {
    a: 'foo',
    b: 'bar',
    hello: 'world'
  });
});

it('allows async mappers when async mode is turned on', async (t) => {
  const obj = await compile(
    `
    a = 'foo' |> @uppercase
    b = 'bar'
  `,
    {
      async: true,
      mappers: {
        uppercase: (v) => delayed(v.toUpperCase())
      }
    }
  );

  t.deepEqual(obj, {
    a: 'FOO',
    b: 'bar'
  });
});

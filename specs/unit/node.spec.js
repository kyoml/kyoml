const it          = require('ava');
const { Node }    = require('../../lib/tree');

it('throws an error if initialized without a base', (t) => {
  t.throws(() => {
    new Node({}, '', undefined, 'document');
  })
})

it('throws an error if initialized without a root', (t) => {
  t.throws(() => {
    new Node(undefined, '', {}, 'document');
  })
})

it('can create a child node with an extended path', (t) => {
  const root = {
    document: { 
      block: {
        foo: 'bar' 
      }
    }
  };

  const node = new Node(root, 'document.block', root.document, 'block');
  const child = node.child('foo')

  t.is(node.path, 'document.block')
  t.is(child.path, 'document.block.foo')
  t.is(child.value, 'bar')
})

it('can create a child node at an index', (t) => {
  const root = {
    document: { 
      foo: ['bar']
    }
  };

  const node = new Node(root, 'document.foo', root.document, 'foo');
  const child = node.index(0)

  t.is(node.path, 'document.foo')
  t.is(child.path, 'document.foo[0]')
  t.is(child.value, 'bar')
})

it('when serialized, provides the root, full path, base, value and key', (t) => {
  const tree = {
    document: { 
      foo: ['bar']
    },
    other: {
      item: 'yay'
    }
  };

  const node = new Node(tree, 'document.foo', tree.document, 'foo');

  const { root, path, base, key, value } = node.serialize();

  t.is(root, tree)
  t.is(path, 'document.foo')
  t.is(base, tree.document)
  t.is(key, 'foo');
  t.deepEqual(value, ['bar']);
})


it('when serialized, provide a get method to traverse the whole tree', (t) => {
  const root = {
    document: { 
      foo: ['bar']
    },
    other: {
      item: 'yay'
    }
  };

  const node = new Node(root, 'document.foo', root.document, 'foo');

  const { get } = node.serialize();

  t.is(get('other.item'), 'yay')
})

it('when serialized, provide a set method to replace the value in the tree', (t) => {
  const root = {
    document: { 
      foo: ['bar']
    },
    other: {
      item: 'yay'
    }
  };

  const node = new Node(root, 'document.foo[0]', root.document.foo, 0);

  const { set } = node.serialize();

  t.is(root.document.foo[0], 'bar')
  set('hi')
  t.is(root.document.foo[0], 'hi')
})

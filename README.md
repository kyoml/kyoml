# KyoML

A dynamic markup language with support for directives and plugins

[![codecov](https://codecov.io/gh/kyoml/kyoml/branch/main/graph/badge.svg?token=MLZAZ3W7BK)](https://codecov.io/gh/kyoml/kyoml)
[![Specs](https://github.com/kyoml/kyoml/actions/workflows/specs.yml/badge.svg)](https://github.com/kyoml/kyoml/actions/workflows/specs.yml)

<img src="https://github.com/kyoml/kyoml/blob/main/resources/preview_carbon.png?raw=true" width="600">

## Basic usage

`npm install --save kyoml`

```javascript
const kyoml = require('kyoml');

const json = kyoml.compile(`
  key1 = 'value1'
  key2 = 'value2'

  block {
    key3 = [1,2,3]
  }
`)
```

## Directives

Directives can be added anywhere in the document with an `@` prefix. In essence they are functions that allow you to alter your document and create enriched experiences.

```javascript
const kyoml = require('kyoml');

const json = kyoml.compile(`
  key1 = 'value1'
  key2 = 'value2'

  block {
    @uppercase

    key3 = [1,2,3]
  }
`, {
  directives: {
    uppercase: (node) => {
      const {
        root,   // The root of the entire document
        base,   // The direct parent on which element you're operating on is
        key,    // The key on the base which contains the element
        path,   // The full path from the root (e.g document.block)
        value,  // The element itself
        set,    // A handy replace method
        get     // A getter allowing you to access anything in the entire document
      } = node;

      // You can now operate on your node

      set(_.mapKeys(value, key => key.toUpperCase()));
    }
  }
})
```

Output:

```json
{
  "key1": "value1",
  "key2": "value2",
  "block": {
    "KEY3": [1,2,3]
  }
}
```

### Directives with arguments

Directives can also take arguments, e.g


```javascript
const kyoml = require('kyoml');

const json = kyoml.compile(`
  @prefix("foo_")

  key1 = 'value1'
  key2 = 'value2'

  block {
    key3 = [1,2,3]
  }
`, {
  directives: {
    prefix: ({ value }, prefix) => {
      set(_.mapKeys(value, key => prefix + key));
    }
  }
})
```

Output:

```json
{
  "foo_key1": "value1",
  "foo_key2": "value2",
  "foo_block": {
    "key3": [1,2,3]
  }
}
```

### Mappers

Mappers are simply directives, which replace the value directly

```javascript
const kyoml = require('kyoml');

const json = kyoml.compile(`
  @addProperty("foo")

  key1 = 'value1'
  key2 = 'value2'
`, {
  mappers: {
    addProperty: (value, key) => ({ ...value, [key]: 'bar' })
  }
})
```

Output:

```json
{
  "key1": "value1",
  "key2": "value2",
  "foo": "bar"
}
```

### Piping

Values can be piped into directives using the directional `|>` or `|<` operators

e.g

```javascript
const kyoml = require('kyoml');

const json = kyoml.compile(`
  key1 = 'value1' |> @uppercase
  key2 = @uppercase <| 'value2'
`, {
  mappers: {
    uppercase: (value) => (value.toUpperCase())
  }
})
```

Output:

```json
{
  "key1": "VALUE1",
  "key2": "VALUE2"
}
```

## String interpolation

String interpolation is supported using `${}`

Example

```kyoml
block {
  hello = 'hello'

  subblock {
    array = ["world"]
    sentence = "${block.hello} ${block.subblock.array[0]}"
  }
}
```

**NOTE:** only double quoted strings will be interpolated

## Supported types

- Strings
- Numbers
- Arrays
- Object
- Booleans
## Roadmap

- [x] Primitive types
- [x] Comments
- [x] Blocks
- [x] Directives
- [x] Pipes
- [ ] VSCode syntax hightlighting
- [ ] Playground
- [ ] CLI converter

# KyoML

A dynamic markup language with support for directives and plugins

[![codecov](https://codecov.io/gh/kyoml/kyoml/branch/main/graph/badge.svg?token=MLZAZ3W7BK)](https://codecov.io/gh/kyoml/kyoml)
[![Specs](https://github.com/kyoml/kyoml/actions/workflows/specs.yml/badge.svg)](https://github.com/kyoml/kyoml/actions/workflows/specs.yml)

<img src="https://github.com/kyoml/kyoml/blob/main/resources/preview_carbon.png?raw=true" width="600">

## Basic usage

`npm install --save kyoml`

```javascript
const fs = require('fs')
const kyoml = require('kyoml');

const json = kyoml.parse(`
  key1 = 'value1'
  key2 = 'value2'

  block {
    key3 = [1,2,3]
  }
`)

console.log(json);
```

## Loading up directives

```javascript
const fs = require('fs')
const kyoml = require('kyoml');

const json = kyoml.parse(`
  @uppercase

  key1 = 'value1'
  key2 = 'value2'

  block {
    key3 = [1,2,3]
  }
`, {
  directives: {
    uppercase: (block) => _.mapKeys(block, k => k.toUpperCase())
  }
})
```

## Roadmap

- [x] Primitive types
- [x] Comments
- [x] Blocks
- [x] Directives
- [x] Pipes
- [ ] VSCode syntax hightlighting
- [ ] Playground
- [ ] CLI converter

Start = BlockContent

// -------------------------
// Generic
// -------------------------

Key = chars:([a-zA-Z][a-zA-Z0-9_]*) {
  if (chars.length === 1) return chars[0]
  return chars[0] + chars[1].join('')
}

_  = [ \t\n\r]*  

d = [0-9]

// -------------------------
// Structure
// -------------------------

Block = "{" _ content:BlockContent? _ "}" {
  return {
    type: 'Block',
    value: content
  }
}

BlockContent = _ first:(Directive / BlockKeyValue / SubBlock) [,]? rest:BlockContent? _ {
  return rest ? [first, ...rest] : [first]
}

SubBlock = _ key:Key _ value:Block { return { key, ...value } }

BlockKeyValue = _ key:Key _ "=" _ value:Value { return { key, ...value } }


// -------------------------
// Directives
// -------------------------

Directive = [@] key:Key args:DirectivesArgs? {
  return { key, args: args || [], type: 'Directive'}
}

DirectivesArgs = [(] values:ValueList? [)] {
  return values
}

// -------------------------
// Primitive Types
// -------------------------

Value = String / Number / Boolean / Array / Map

ValueList =  _ first:(Value) [,]? rest:ValueList? _ {
  return rest ? [first, ...rest] : [first]
}

/* ------ Arrays ------ */

Array = '[' items:ArrayContent? ']' {
  return {
    type: 'Array',
    value: items || []
  }
}

ArrayContent = ValueList


/* ------ Maps ------ */

Map = "{" _ content:MapEntries? _ "}" {
  return {
    type: 'Map',
    value: content || []
  }
}

MapEntries =
  first:MapKeyVal _ ',' _ rest:MapEntries { return [first, ...rest] } /
  single:MapKeyVal { return [single] }

MapKeyVal = _ key:String _ ":" _ value:Value {
  return { key: key.value, ...value }
}

/* ------ Number ------ */

Number = chars:([0-9,]+ "." [0-9]+ / [0-9,]+) {
  return {
    type: 'Number',
    value: Number(chars.join('').replace(/,/g, ''))
  }
}

/* ------ Booleans ------ */

Boolean = value:("true" / "false" / "yes" / "no") {
  return {
    type: 'Boolean',
    value: value === "true" || value === "yes"
  }
}

/* ------ String ------ */

String = RawString / ComplexString

RawString = ['] string:[^']* ['] {
  return {
    type:   "RawString",
    value:  string.join('')
  }
}

ComplexString = ["] string:[^"]* ["] {
  return {
    type:   "ComplexString",
    value:  string.join('')
  }
}


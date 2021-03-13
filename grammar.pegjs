Start = BlockContent

// -------------------------
// Generic
// -------------------------

Key = chars:([a-zA-Z][a-zA-Z0-9_]*) {
  if (chars.length === 1) return chars[0]
  return chars[0] + chars[1].join('')
}

_  = [ \t\n\r]*

eol = [ \t\r]* ","? [ \t\r]* [\n]

d = [0-9]

// -------------------------
// Structure
// -------------------------

Block = "{" _ content:BlockContent? _ "}" eol {
  return {
    type: 'Block',
    value: content
  }
}

BlockContent = _ first:(Directive / BlockKeyValue / SubBlock) [,]? rest:BlockContent? _ {
  return rest ? [first, ...rest] : [first]
}

SubBlock = _ key:Key _ value:Block { return { key, ...value } }

BlockKeyValue = _ key:Key _ "=" _ value:Value eol { return { key, ...value } }

// -------------------------
// Directives
// -------------------------

Directive = [@] key:Key args:DirectivesArgs? {
  return { key, args: args || [], type: 'Directive'}
}

DirectivesArgs = [(] values:ValueList? [)] {
  return values
}

RightPipedDirectives = 
  first:Directive _ "|>" _ rest:RightPipedDirectives { return [first, ...rest] } /
  single:Directive { return [single] }

LeftPipedDirectives = 
  first:Directive _ "<|" _ rest:LeftPipedDirectives _ { return [...rest, first] } /
  single:Directive { return [single] }

// -------------------------
// Value definition
// -------------------------

Value =  ComputedValue / RawValue

ComputedValue =
  raw:RawValue _ "|>" _ directives:RightPipedDirectives {
    return {
      type: 'ComputedValue',
      value: {
        raw: raw,
        directives: directives
      }
    }
  } /
  directives:LeftPipedDirectives _ "<|" _ raw:RawValue {
  return {
    type: 'ComputedValue',
    value: {
      raw: raw,
      directives: directives
    }
  }
}

RawValue = Array / Map / String / Number / Boolean

// -------------------------
// Primitive Types
// -------------------------

ValueList = 
  _ first:(Value) _ ',' _ rest:ValueList _ { return [first, ...rest] } /
  _ single:Value _ { return [single] }

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

Number = chars:[0-9.]+ {
  const str = chars.join('');
  const n = Number(str)
  
  if (isNaN(n)) {
    throw new SyntaxError(`Invalid number ${str}`)
  }

  return {
    type: 'Number',
    value: Number(chars.join(''))
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


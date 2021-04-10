{
  const backslash = require('backslash');
}

Start = body:BlockContent {
  return {
    type: 'Block',
    value: body || []
  }
}

// -------------------------
// Generic
// -------------------------

Key = chars:([a-zA-Z][a-zA-Z0-9_]*) {
  if (chars.length === 1) return chars[0]
  return chars[0] + chars[1].join('')
}

_  = (Comment / [ \t\n\r])*

eol = [ \t\r]* ","? ([ \t\r]* Comment / [ \t\r]* [\n])

d = [0-9]

// -------------------------
// Structure
// -------------------------

Block = "{" _ content:BlockContent? _ "}" eol {
  return {
    type: 'Block',
    value: content || []
  }
}

BlockContent = _ first:(Directive / BlockKeyValue / SubBlock) [,]? rest:BlockContent? _ {
  return rest ? [first, ...rest] : [first]
}

SubBlock = _ key:Key _ value:Block { return { key, ...value } }

BlockKeyValue = _ key:Key _ "=" _ value:Value eol { return { key, ...value } }

Comment = "#" comment:([^\n]*) [\n]

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

Value =  PipedValue / RawValue

PipedValue =
  raw:RawValue _ "|>" _ directives:RightPipedDirectives {
    return {
      type: 'PipedValue',
      value: {
        raw: raw,
        directives: directives
      }
    }
  } /
  directives:LeftPipedDirectives _ "<|" _ raw:RawValue {
    return {
      type: 'PipedValue',
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

Number = sign:([-+]?) _ chars:(Number16 / Number8 / Number2 / Number10) {
  const n = Number(chars)
  const mul = (sign && sign === '-') ? -1 : 1;
  
  if (isNaN(n)) {
    throw new SyntaxError(`Invalid number ${chars}`)
  }

  return {
    type: 'Numeric',
    value: mul * n
  }
}

BasicNumber = chars:([0-9.]+) { return chars.join('') }

Number10 = left:BasicNumber right:([Ee] [-+]? BasicNumber)? {
  return left + (right || []).join('')
}
Number16 = "0x" chars:([0-9a-f]i+) { return '0x' + chars.join('') }
Number8 = "0o" chars:([0-7]+) { return '0o' + chars.join('') }
Number2 = "0b" chars:([01]+) { return '0b' + chars.join('') }

/* ------ Booleans ------ */

Boolean = value:("true" / "false" / "yes" / "no") {
  return {
    type: 'Boolean',
    value: value === "true" || value === "yes"
  }
}

/* ------ String ------ */

String = RawString / ComplexString

RawString = ['] string:("\\'" / [^'\n])* ['] {
  return {
    type:   "RawString",
    value:  backslash(string.join(''))
  }
}

ComplexString = ["] string:('\\"' / [^"\n])* ["] {
  return {
    type:   "ComplexString",
    value:  backslash(string.join(''))
  }
}


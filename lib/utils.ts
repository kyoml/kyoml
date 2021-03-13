import {
  Value,
  Block,
  ComplexString,
  RawString,
  Numeric,
  Bool,
  Json,
  List
} from "./types";

export function isBlock(val : Value) : val is Block {
  return val.type === 'Block'
}

export function isRawString(val: Value) : val is RawString {
  return val.type === 'RawString'
}

export function isNumeric(val: Value) : val is Numeric {
  return val.type === 'Numeric'
}

export function isBoolean(val: Value) : val is Bool {
  return val.type === 'Boolean'
}

export function isList(val: Value) : val is List {
  return val.type === 'Array'
}

export function isComplexString(val: Value) : val is ComplexString {
  return val.type === 'ComplexString';
}

export class Ref {
  constructor(private base: Json, private key: string|number) {}

  replace(tranformer: (v: any) => any) {
    this.base[this.key] = tranformer(this.base[this.key]);
  }
}

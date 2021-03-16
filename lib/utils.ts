import {
  Value,
  Block,
  ComplexString,
  RawString,
  Numeric,
  Directive,
  Bool,
  Json,
  List,
  Map,
  PegNode
} from "./types";

export type AnyFunction = (...args: any[]) => any

export interface Dictionary<T> {
  [key: string]: T
}

export function isValue(val: PegNode) : val is Value {
  return (<any>val).value !== void 0
}

export function isBlock(val : PegNode) : val is Block {
  return val.type === 'Block'
}

export function isDirective(val : PegNode) : val is Directive {
  return val.type === 'Directive'
}

export function isRawString(val: PegNode) : val is RawString {
  return val.type === 'RawString'
}

export function isNumeric(val: PegNode) : val is Numeric {
  return val.type === 'Numeric'
}

export function isBoolean(val: PegNode) : val is Bool {
  return val.type === 'Boolean'
}

export function isList(val: PegNode) : val is List {
  return val.type === 'Array'
}

export function isMap(val: PegNode) : val is Map {
  return val.type === 'Map'
}

export function isComplexString(val: PegNode) : val is ComplexString {
  return val.type === 'ComplexString';
}

export class Ref {
  constructor(public base: Json, public key: string|number) {}

  replace(tranformer: (v: any) => any) {
    this.base[this.key] = tranformer(this.base[this.key]);
  }
}

export class AssemblyLine {
  private tasks : Dictionary<AnyFunction[]> = {}

  process(step : string, ...args: any[]) {
    const jobs = this.tasks[step] || [];

    while (jobs.length > 0) {
      const job = <AnyFunction>jobs.shift();
      job(...args)
    }
  }

  queue(step : string, fn: AnyFunction) {
    if (this.tasks[step]) {
      this.tasks[step].push(fn)
    } else {
      this.tasks[step] = [fn]
    }
  }
}

import {
  Value,
  Block,
  ComplexString,
  Directive,
  PipedValue,
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

export function isList(val: PegNode) : val is List {
  return val.type === 'Array'
}

export function isMap(val: PegNode) : val is Map {
  return val.type === 'Map'
}

export function isPipedValue(val: PegNode) : val is PipedValue {
  return val.type === 'PipedValue'
}

export function isComplexString(val: PegNode) : val is ComplexString {
  return val.type === 'ComplexString';
}

export function pipe(value: any, funcs: AnyFunction[] = []) {
  for (const fn of funcs) {
    if (isPromise(value)) {
      value = value.then(fn);
    } else {
      value = fn(value);
    }
  }

  return value;
}

export function isPromise(val: any) : val is Promise<any> {
  return (typeof val?.then === 'function');
}

export function strictExtend<T extends Record<string, any>>(left: T, right: T) : T {
  for (const key in right) {
    if (left[key]) {
      throw new Error(`Name conflict detected: ${key} already defined`);
    }
    left[key] = right[key];
  }
  return left;
}

export function once<T extends AnyFunction>(fn: T) : T {
  const res : any = {};

  return ((...args: any[]) => {
    if (!Object.prototype.hasOwnProperty.call(res, 'result')) {
      res.result = fn(...args);
    }
    return res.result;
  }) as T
}

export class AssemblyLine {
  private tasks : Dictionary<AnyFunction[]> = {}

  public processSync(step : string, ...args: any[]) {
    const jobs = this.tasks[step] || [];

    while (jobs.length > 0) {
      const job = <AnyFunction>jobs.shift();
      job(...args);
    }
  }

  public async processAsync(step : string, ...args: any[]) {
    const jobs = this.tasks[step] || [];

    while (jobs.length > 0) {
      const job = <AnyFunction>jobs.shift();
      await job(...args);
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

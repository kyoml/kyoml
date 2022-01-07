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

export type AssemblyTaskOptions = {
  persist?: boolean
}

export type AssemblyTask = {
  step: string,
  fn: AnyFunction,
  opts: AssemblyTaskOptions
}


export class AssemblyLine {
  private tasks : AssemblyTask[] = []

  public processSync(stepToRun : string, ...args: any[]) {
    for (let i = 0; i < this.tasks.length; ++i) {
      const { step, opts, fn } = this.tasks[i];

      if (stepToRun === "*" || stepToRun === step) {
        fn(...args);

        if (!opts.persist) {
          this.tasks.splice(i, 1);
          i--;
        }
      }
    }
  }

  public async processAsync(stepToRun : string, ...args: any[]) {
    for (let i = 0; i < this.tasks.length; ++i) {
      const { step, opts, fn } = this.tasks[i];

      if (stepToRun === "*" || stepToRun === step) {
        await fn(...args);

        if (!opts.persist) {
          this.tasks.splice(i, 1);
          i--;
        }
      }
    }
  }

  queue(step : string, opts: AssemblyTaskOptions, fn: AnyFunction) {
    this.tasks.push({ step, fn, opts })
  }
}

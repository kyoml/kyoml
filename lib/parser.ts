import { parse as peg }                                 from '../grammar'
import { isBlock, isComplexString, isList, isNumeric, isRawString, Ref }   from './utils'
import { ComputableString }                             from './strings'
import {
  Block,
  ComplexString,
  Json,
  KeyValue,
  List,
  RawString,
  Value
} from "./types"

export interface ParserOptions {
  postProcess?: boolean
  directives?:  Array<(v: any) => any>
}

const DEFAULT_OPTS = {
  postProcess: true,
  directives: []
}

type PostProcessTask = (out: Json, ...args: any[]) => any

/**
 * KyoML to JSON converter
 *
 * @export
 * @class Parser
 */
export class Parser {
  private postProcessTasks  : PostProcessTask[] = []
  private opts              : ParserOptions

  constructor(opts : ParserOptions) {
    this.opts = { ...DEFAULT_OPTS, ...opts };
  }

  public parse<T extends Json = Json>(txt : string) : T {
    const base  = {};
    const kvs   = peg(txt) as KeyValue[];
    
    for (const kv of kvs) {
      base[kv.key] = this.normalize(kv, new Ref(base, kv.key))
    }
  
    this.postProcessTasks.forEach(task => task(base));

    return base as T;
  }

  private addPostProcessTask(task : PostProcessTask) {
    this.postProcessTasks.push(task)
  }

  private normalize(val : Value, ref: Ref) : any {
    if (isBlock(val))         return this.normalizeBlock(val, ref);
    if (isComplexString(val)) return this.normalizeComplexString(val, ref);
    if (isList(val))          return this.normalizeList(val);

    return this.bypassNormalize(val);
  }

  private normalizeBlock(block: Block, ref: Ref) : Json {
    return block.value.reduce((obj, kv) => {
      obj[kv.key] = this.normalize(kv, new Ref(obj, kv.key));
      return obj;
    }, {});
  }

  private normalizeList(val: List) : Array<any> {
    const out = [] as any[];

    for (const i in val.value) {
      out[i] = this.normalize(val.value[i], new Ref(out, i));
    }

    return out;
  }

  private bypassNormalize(val: Value) : any {
    return val.value;
  }

  private normalizeComplexString(val: ComplexString, ref: Ref) : ComputableString|string {
    if (!this.opts.postProcess) {
      return val.value;
    }

    this.addPostProcessTask((tree) => {
      ref.replace(str => str.compute([tree]))
    });

    return new ComputableString(val.value);
  }
}

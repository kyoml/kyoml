import { parse as peg } from '../grammar'
import { ComputableString } from './strings'
import { AnyFunction, AssemblyLine, isBlock, isComplexString, isDirective, isList, isMap, isValue, Ref } from './utils'
import { Block, ComplexString, Directive, Json, JsonValue, List, Map, PegNode, Value } from "./types"

export interface ParserOptions {
  interpolate: boolean
  directives: { [key: string]: AnyFunction }
}

const DEFAULT_OPTS : ParserOptions = {
  interpolate: true,
  directives: {}
}

/**
 * KyoML to JSON converter
 *
 * @export
 * @class Parser
 */
export class Parser extends AssemblyLine {
  private opts : ParserOptions
  private root : { out: Json } = { out: {} }

  constructor(opts : Partial<ParserOptions>) {
    super();
    this.opts = { ...DEFAULT_OPTS, ...opts };
  }

  private get json() : Json {
    return this.root.out;
  }

  private set json(val : Json) {
    this.root.out = val;
  }

  private get rootRef() : Ref {
    return new Ref(this.root, 'out');
  }

  private get interpolationSources() : Json[] {
    return [this.json];
  }

  /**
   * Main entry point
   *
   * @template T
   * @param {string} txt KyoML string
   * @returns {T}
   * @memberof Parser
   */
  public parse<T extends Json = Json>(txt : string) : T {
    this.reset();

    this.json = this.normalizeBlock(peg(txt), this.rootRef);

    this.process('interpolation', this.interpolationSources);
    this.process('directives', this.json);
  
    return this.json as T;
  }

  private reset() {
    this.root = { out: {} }
  }

  private normalize(node : PegNode, ref: Ref) : any {
    if (isBlock(node))         return this.normalizeBlock(node, ref);
    if (isMap(node))           return this.normalizeMap(node, ref);
    if (isComplexString(node)) return this.normalizeComplexString(node, ref);
    if (isList(node))          return this.normalizeList(node);
    if (isValue(node))         return this.bypassNormalize(node);

    throw new Error(`Cannot normalize PegNode ${node}`)
  }

  private normalizeBlock(block: Block|Map, ref: Ref) : Json {
    const directives : Directive[] = [];
    const obj : Json = {};

    for (const kv of block.value) {
      if (isDirective(kv)) {
        directives.push(kv);
        continue;
      }

      obj[kv.key] = this.normalize(kv, new Ref(obj, kv.key));
    }

    //
    // We queue the directives after the object is normalized
    // to ensure sub-blocks and subdirectives are processed first
    //
    directives.forEach(dir => this.queueDirective(dir, ref));

    return obj;
  }

  private normalizeMap(block: Block|Map, ref: Ref) : Json {
    return block.value.reduce((obj, kv) => {
      obj[kv.key] = this.normalize(kv, new Ref(obj, kv.key));
      return obj;
    }, {});
  }

  private queueDirective(dir: Directive, ref: Ref) : void {
    const func = this.opts.directives[dir.key];

    if (typeof func !== 'function') throw new Error(`Unknown directive ${dir.key}`);

    this.queue('directives', () => {
      let args : any[] = []

      dir.args.forEach((arg, idx) => {
        let val = this.normalize(arg, new Ref(arg, idx));
        if (val instanceof ComputableString) {
          val = val.compute(this.interpolationSources)
        }
        args[idx] = val;
      })

      ref.replace(val => {
        return func(val, ...args)
      })
    });
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
    if (!this.opts.interpolate) {
      return val.value;
    }

    this.queue('interpolation', (sources) => {
      ref.replace(str => str.compute(sources));
    });

    return new ComputableString(val.value);
  }
}

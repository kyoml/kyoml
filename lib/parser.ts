import { parse as peg } from '../grammar'
import { ComputableString } from './strings'
import { AnyFunction, AssemblyLine, isBlock, isComplexString, isPipedValue, isDirective, isList, isMap, isValue, Ref, pipe } from './utils'
import { Block, ComplexString, Directive, Json, List, Map, PegNode, Value, PipedValue } from "./types"

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

  /**
   * Given a PegNode, returns a JS primitive
   */
  private normalize(node : PegNode, ref: Ref) : any {
    if (isPipedValue(node))    return this.normalizePipes(node, ref);
    if (isBlock(node))         return this.normalizeBlock(node, ref);
    if (isMap(node))           return this.normalizeMap(node, ref);
    if (isComplexString(node)) return this.normalizeComplexString(node, ref);
    if (isList(node))          return this.normalizeList(node);
    if (isValue(node))         return this.bypassNormalize(node);

    throw new Error(`Cannot normalize PegNode ${node}`)
  }

  /**
   * 
   * Returns a normalized value, and queues up directives for post-processing
   */
  private normalizePipes(pv: PipedValue, ref: Ref) : any {
    const val = this.normalize(pv.value.raw, ref);

    this.queue('directives', () => {
      const apply = this.compileDirectives(...pv.value.directives);
      ref.replace(val => apply(val))
    });

    return val;
  }

  /**
   *
   * Transforms a Block node into a normal JSON object
   * Directives at the root are applied
   * 
   */
  private normalizeBlock(block: Block, ref: Ref) : Json {
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

  /** Transforms a Map node into a normal JSON object **/
  private normalizeMap(block: Map, ref: Ref) : Json {
    return block.value.reduce((obj, kv) => {
      obj[kv.key] = this.normalize(kv, new Ref(obj, kv.key));
      return obj;
    }, {});
  }

  /** Schedules a directive to be processed after the rest of the object has been normalized **/
  private queueDirective(dir: Directive, ref: Ref) : void {
    this.queue('directives', () => {
      const apply = this.compileDirectives(dir);
      ref.replace(val => apply(val))
    });
  }

  /** Transforms a list node into a JS array, and normalizes each of its elements **/
  private normalizeList(val: List) : Array<any> {
    const out = [] as any[];

    for (const i in val.value) {
      out[i] = this.normalize(val.value[i], new Ref(out, i));
    }

    return out;
  }

  /** Uses the node's value directly without any transformation **/
  private bypassNormalize(val: Value) : any {
    return val.value;
  }

  /** Transforms a ComplexString node into a ComputableString, and schedules it's processing **/
  private normalizeComplexString(val: ComplexString, ref: Ref) : ComputableString|string {
    if (!this.opts.interpolate) {
      return val.value;
    }

    this.queue('interpolation', (sources) => {
      ref.replace(str => str.compute(sources));
    });

    return new ComputableString(val.value);
  }

  /** Transforms a series of directives into a single callable function **/
  private compileDirectives(...dirs: Directive[]) : AnyFunction {
    if (dirs.length === 1) {
      const [dir] = dirs;

      const func = this.opts.directives[dir.key];

      if (typeof func !== 'function') throw new Error(`Unknown directive ${dir.key}`);

      let args = Ref.map(dir.args, (arg, ref) => {
        let val = this.normalize(arg, ref);
        return val instanceof ComputableString ? val.compute(this.interpolationSources) : val
      });

      return (input: any) => func(input, ...args);
    }

    if (dirs.length > 1) {
      const funcs = dirs.map(dir => this.compileDirectives(dir));
      return (input: any) => pipe(input, funcs)
    }

    return (input: any) => input;
  }
}

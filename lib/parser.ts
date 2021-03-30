import { parse as peg }                                                                                                 from '../grammar'
import { ComputableString }                                                                                             from './strings'
import { AnyFunction, AssemblyLine, isBlock, isComplexString, isPipedValue, isDirective, isList, isMap, isValue, pipe } from './utils'
import { Block, ComplexString, Directive, Json, List, Map, PegNode, Value, PipedValue }                                 from "./types"
import { Node }                                                                                                         from './tree'

export interface ParserOptions {
  interpolate: boolean
  directives: { [key: string]: AnyFunction },
  mappers?: { [key: string]: AnyFunction }
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
  private root : { document: Json } = { document: {} }

  constructor(opts : Partial<ParserOptions>) {
    super();
    this.opts = {
      ...DEFAULT_OPTS,
      ...opts,
      directives: { ...opts.directives }
    };

    const { mappers = {} } = opts;

    Object.keys(mappers || {}).forEach(mkey => {
      if (this.opts.directives[mkey]) {
        throw new Error(`Directives and mapper cannot share the same key (${mkey})`);
      }

      const mapper = mappers[mkey];
      this.opts.directives[mkey] = ({ value, set }, ...args: any[]) => {
        set(mapper(value, ...args));
      }
    })
  }

  private get json() : Json {
    return this.root.document;
  }

  private set json(val : Json) {
    this.root.document = val;
  }

  private get interpolationSources() : Json[] {
    return [this.json];
  }

  /**
   * Main entry point
   */
  public parse<T extends Json = Json>(txt : string) : T {
    this.reset();

    const tree = new Node(this.root, 'document', this.root, 'document');

    this.json = this.normalizeBlock(peg(txt), tree);

    this.process('interpolation', this.interpolationSources);
    this.process('directives', this.json);

    return this.json as T;
  }

  private reset() {
    this.root = { document: {} }
  }

  /**
   * Given a PegNode, returns a JS primitive
   */
  private normalize(node : PegNode, ref: Node) : any {
    if (isPipedValue(node))    return this.normalizePipes(node, ref);
    if (isBlock(node))         return this.normalizeBlock(node, ref);
    if (isMap(node))           return this.normalizeMap(node, ref);
    if (isComplexString(node)) return this.normalizeComplexString(node, ref);
    if (isList(node))          return this.normalizeList(node, ref);
    if (isValue(node))         return this.bypassNormalize(node);

    throw new Error(`Cannot normalize PegNode ${node}`)
  }

  /**
   * 
   * Returns a normalized value, and queues up directives for post-processing
   */
  private normalizePipes(pv: PipedValue, ref: Node) : any {
    const val = this.normalize(pv.value.raw, ref);

    this.queue('directives', () => {
      const apply = this.compileDirectives(ref, ...pv.value.directives);
      apply(ref.serialize())
    });

    return val;
  }

  /**
   *
   * Transforms a Block node into a normal JSON object
   * Directives at the root are applied
   * 
   */
  private normalizeBlock(block: Block, ref: Node) : Json {
    const directives : Directive[] = [];
    const obj : Json = {};

    for (const kv of block.value) {
      if (isDirective(kv)) {
        directives.push(kv);
        continue;
      }

      obj[kv.key] = this.normalize(kv, ref.child(kv.key, obj));
    }

    //
    // We queue the directives after the object is normalized
    // to ensure sub-blocks and subdirectives are processed first
    //
    directives.forEach(dir => this.queueDirective(dir, ref));

    return obj;
  }

  /** Transforms a Map node into a normal JSON object **/
  private normalizeMap(block: Map, ref: Node) : Json {
    return block.value.reduce((obj, kv) => {
      obj[kv.key] = this.normalize(kv, ref.child(kv.key, obj));
      return obj;
    }, {});
  }

  /** Schedules a directive to be processed after the rest of the object has been normalized **/
  private queueDirective(dir: Directive, ref: Node) : void {
    this.queue('directives', () => {
      const apply = this.compileDirectives(ref, dir);
      apply(ref.serialize());
    });
  }

  /** Transforms a list node into a JS array, and normalizes each of its elements **/
  private normalizeList(val: List, ref: Node) : Array<any> {
    const out = [] as any[];

    for (let i = 0; i < val.value.length; ++i) {
      out[i] = this.normalize(val.value[i], ref.index(i, out))
    }

    return out;
  }

  /** Uses the node's value directly without any transformation **/
  private bypassNormalize(val: Value) : any {
    return val.value;
  }

  /** Transforms a ComplexString node into a ComputableString, and schedules it's processing **/
  private normalizeComplexString(val: ComplexString, ref: Node) : ComputableString|string {
    if (!this.opts.interpolate) {
      return val.value;
    }

    this.queue('interpolation', (sources) => {
      ref.replace(str => str.compute(sources));
    });

    return new ComputableString(val.value);
  }

  /** Transforms a series of directives into a single callable function **/
  private compileDirectives(ref: Node, ...dirs: Directive[]) : AnyFunction {
    if (dirs.length === 1) {
      const [dir] = dirs;

      const func = this.opts.directives[dir.key];

      if (typeof func !== 'function') throw new Error(`Unknown directive ${dir.key}`);

      const args : Array<any> = []

      for (let idx = 0; idx < dir.args.length; ++idx) {
        let idxRef  = ref.index(idx, args);
        let val     = this.normalize(dir.args[idx], idxRef);
        args[idx] = val instanceof ComputableString ? val.compute(this.interpolationSources) : val
      }

      return (input: any) => {
        func(input, ...args);
        return input;
      };
    }

    if (dirs.length > 1) {
      const funcs = dirs.map(dir => this.compileDirectives(ref, dir));
      return (input: any) => pipe(input, funcs)
    }

    return (input: any) => input;
  }
}

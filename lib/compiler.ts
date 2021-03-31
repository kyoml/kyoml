import { Block, ComplexString, Directive, Json, List, Map, PegNode, Value, PipedValue }   from "./types"
import { ComputableString }                                                               from './strings'
import { parse as peg }                                                                   from '../grammar'
import { Node }                                                                           from './tree'
import {
  AnyFunction,
  AssemblyLine,
  isBlock,
  isComplexString,
  isPipedValue,
  isDirective,
  isList, isMap,
  isValue, pipe
} from './utils'


// ------------------------------------
// Compiler Types
// ------------------------------------

export interface CompilerConfig {
  interpolate: boolean
  directives: { [key: string]: AnyFunction }
}

export interface CompilerOptions extends CompilerConfig {
  mappers: { [key: string]: AnyFunction }
}

// ------------------------------------
// Config normalization
// ------------------------------------

export function prepareConfig(opts: Partial<CompilerOptions>) : CompilerConfig {
  const config : CompilerConfig = {
    interpolate: opts.interpolate ?? true,
    directives: { ...opts.directives }
  }

  const { mappers = {} } = opts;

  Object.keys(mappers || {}).forEach(mkey => {
    if (config.directives[mkey]) {
      throw new Error(`Directives and mappers cannot share the same key (${mkey})`);
    }

    const mapper = mappers[mkey];
    config.directives[mkey] = ({ value, set }, ...args: any[]) => {
      set(mapper(value, ...args));
    }
  })

  return config;
}

// ------------------------------------
// Compiler
// ------------------------------------

/**
 * KyoML compiler
 *
 * @export
 * @template T
 * @param {string} txt the raw KyoML string
 * @param {Partial<CompilerOptions>} opts compilation options
 * @returns {T} a javascript object
 */
export function compile<T extends Json = Json>(txt: string, opts: Partial<CompilerOptions> = {}) : T {
  const config    = prepareConfig(opts);
  const assembler = new AssemblyLine();

  const root : { document: Json } = { document: {} }

  const tree = new Node(root, 'document', root, 'document');

  const getInterpolationSources = () => [root.document]

  /**
   * Given a PegNode, returns a JS primitive
   */
  const normalize = (node : PegNode, ref: Node) : any => {
    if (isPipedValue(node))    return normalizePipes(node, ref);
    if (isBlock(node))         return normalizeBlock(node, ref);
    if (isMap(node))           return normalizeMap(node, ref);
    if (isComplexString(node)) return normalizeComplexString(node, ref);
    if (isList(node))          return normalizeList(node, ref);
    if (isValue(node))         return bypassNormalize(node);

    throw new Error(`Cannot normalize PegNode ${node}`)
  }

  /**
   * Returns a normalized value, and queues up directives for post-processing
   */
  const normalizePipes = (pv: PipedValue, ref: Node) : any => {
    const val = normalize(pv.value.raw, ref);

    assembler.queue('directives', () => {
      const apply = compileDirectives(ref, ...pv.value.directives);
      apply(ref.serialize())
    });

    return val;
  }
  
  /**
   * Transforms a Block node into a normal JSON object
   * Directives at the root are applied
   */
  const normalizeBlock = (block: Block, ref: Node) : Json => {
    const directives : Directive[] = [];
    const obj : Json = {};

    for (const kv of block.value) {
      if (isDirective(kv)) {
        directives.push(kv);
        continue;
      }

      obj[kv.key] = normalize(kv, ref.child(kv.key, obj));
    }

    //
    // We queue the directives after the object is normalized
    // to ensure sub-blocks and subdirectives are processed first
    //
    directives.forEach(dir => queueDirective(dir, ref));

    return obj;
  }
  
  /** Transforms a Map node into a normal JSON object **/
  const normalizeMap = (block: Map, ref: Node) : Json => {
    return block.value.reduce((obj, kv) => {
      obj[kv.key] = normalize(kv, ref.child(kv.key, obj));
      return obj;
    }, {});
  }

  /** Shedules a directive to be applied to a node after the first rendering pass */
  const queueDirective = (dir: Directive, ref: Node) : void => {
    assembler.queue('directives', () => {
      const apply = compileDirectives(ref, dir);
      apply(ref.serialize());
    });
  }

  /** Transforms a list node into a JS array, and normalizes each of its elements **/
  const normalizeList = (val: List, ref: Node) : Array<any> => {
    const out = [] as any[];

    for (let i = 0; i < val.value.length; ++i) {
      out[i] = normalize(val.value[i], ref.index(i, out))
    }

    return out;
  }

  /** Uses the node's value directly without any transformation **/
  const bypassNormalize = (val: Value) : any => {
    return val.value;
  }

  /** Transforms a ComplexString node into a ComputableString, and schedules it's processing **/
  const normalizeComplexString = (val: ComplexString, ref: Node) : ComputableString|string => {
    if (!config.interpolate) {
      return val.value;
    }

    assembler.queue('interpolation', (sources) => {
      ref.replace(str => str.compute(sources));
    });

    return new ComputableString(val.value);
  }

  /** Transforms a series of directives into a single callable function **/
  const compileDirectives = (ref: Node, ...dirs: Directive[]) : AnyFunction => {
    if (dirs.length === 1) {
      const [dir] = dirs;

      const func = config.directives[dir.key];

      if (typeof func !== 'function') throw new Error(`Unknown directive ${dir.key}`);

      const args : Array<any> = []

      for (let idx = 0; idx < dir.args.length; ++idx) {
        const idxRef  = ref.index(idx, args);
        const val     = normalize(dir.args[idx], idxRef);
        args[idx] = val instanceof ComputableString ? val.compute(getInterpolationSources()) : val
      }

      return (input: any) => {
        func(input, ...args);
        return input;
      };
    }

    if (dirs.length > 1) {
      const funcs = dirs.map(dir => compileDirectives(ref, dir));
      return (input: any) => pipe(input, funcs)
    }

    return (input: any) => input;
  }
  
  // Parse and normalize data

  root.document = normalizeBlock(peg(txt), tree);

  // Apply post-processing

  assembler.process('interpolation', getInterpolationSources());
  assembler.process('directives', root.document);

  return root.document as T
}

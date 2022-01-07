import { Block, ComplexString, Directive, Json, List, Map, PegNode, Value, PipedValue }                from "./types"
import { ComputableString }                                                                            from './strings'
import { parse as peg }                                                                                from '../grammar'
import { Node, SerializedNode }                                                                        from './tree'
import { resolvePlugins, Plugin }                                                                      from './plugins'
import {
  AnyFunction,
  AssemblyLine,
  isBlock,
  isComplexString,
  isPipedValue,
  isDirective,
  isList, isMap,
  isValue, pipe, isPromise, strictExtend
} from './utils'

// ------------------------------------
// Compiler Types
// ------------------------------------

export type DirectiveFunc = (node: SerializedNode, ...args: any[]) => any

export interface CompilerConfig {
  async: boolean
  interpolate: boolean
  directives: { [key: string]: DirectiveFunc }
  plugins: boolean|Plugin[]
}

export interface CompilerOptions extends CompilerConfig {
  mappers: { [key: string]: AnyFunction }
}

type Result<T, C> = C extends { async: true } ? Promise<T> : T

// ------------------------------------
// Config normalization
// ------------------------------------

const asyncPanic = (name: string) => { throw new Error(`Async directive ${name} used outside of async mode`) }

function mapperToDirective(name: string, mapper: AnyFunction, config: CompilerConfig) {
  return ({ value, set }, ...args: any[]) => {
    const res = mapper(value, ...args);

    if (isPromise(res)) {
      if (!config.async) asyncPanic(name)
      return res.then(v => {
        set(v);
      })
    } else {
      set(res);
    }
  }
}

function prepareConfig(opts: Partial<CompilerOptions>) : CompilerConfig {
  const config : CompilerConfig = {
    async: opts.async ?? false,
    interpolate: opts.interpolate ?? true,
    directives: { ...opts.directives },
    plugins: opts.plugins ?? true
  }

  const { mappers = {} } = opts;

  const plugin = resolvePlugins(config);

  strictExtend(mappers, plugin.mappers);
  strictExtend(config.directives, plugin.directives);

  Object.keys(mappers || {}).forEach(mkey => {
    if (config.directives[mkey]) {
      throw new Error(`Directives and mappers cannot share the same key (${mkey})`);
    }
    config.directives[mkey] = mapperToDirective(mkey, mappers[mkey], config);
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
export function compile<T extends Json, C extends Partial<CompilerOptions>>(
  txt: string,
  opts?: C
) : Result<T, C> {
  const config    = prepareConfig(opts || {});
  const assembler = new AssemblyLine();

  const root : { document: Json } = { document: {} }

  const tree = new Node(root, 'document', root, 'document');

  const getInterpolationSources = () => [root.document]

  const maybeWaitFor = (name: string, maybePromise: any, ret: any) : any => {
    if (!isPromise(maybePromise)) {
      return ret;
    }

    if (!config.async) {
      asyncPanic(name);
    }

    return maybePromise.then(() => ret);
  }

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

    queueDirective(ref, ...pv.value.directives)

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
    directives.forEach(dir => queueDirective(ref, dir));

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
  const queueDirective = (ref: Node, ...dirs: Directive[]) : void => {
    assembler.queue('directives', () => {
      const apply = compileDirectives(ref, ...dirs);
      return apply(ref.serialize());
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
    const { value } = val;

    if (!config.interpolate) {
      return value;
    }

    const computable = new ComputableString(value);

    assembler.queue('interpolation', (sources) => {
      ref.replace(() => computable.compute(sources));
    });

    return computable;
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
        const res = func(input, ...args);
        return maybeWaitFor(dir.key, res, input);
      }
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

  if (config.async) {
    return (
      assembler.processAsync('interpolation', getInterpolationSources())
        .then(() => assembler.processAsync('directives', root.document))
        .then(() => assembler.processAsync('interpolation', getInterpolationSources()))
        .then(() => root.document)
    ) as Result<T, C>
  }

  assembler.processSync('interpolation', getInterpolationSources());
  assembler.processSync('directives', root.document);
  assembler.processSync('interpolation', getInterpolationSources());

  return root.document as Result<T, C>
}


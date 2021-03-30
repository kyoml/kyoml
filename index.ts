import { Parser, ParserOptions } from "./lib/parser";
import { Json }                  from "./lib/types"

export function compile<T extends Json = Json>(text: string, opts : Partial<ParserOptions> = {}) : T {
  return new Parser(opts).parse(text);
}

export default compile;

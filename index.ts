import { Parser, ParserOptions } from "./lib/parser";
import { Json } from "./lib/types"

export function parse<T extends Json = Json>(text: string, opts : ParserOptions = {}) : T {
  return new Parser(opts).parse(text);
}

export default parse;

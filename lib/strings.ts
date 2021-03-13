import { Json } from "./types";
import get      from 'lodash.get'

export class ComputableString {
  constructor(private str: string) {}

  public raw() : string {
    return this.str;
  }

  public compute(sources: Json[], stack : string[] = []) : string {
    const rexp = /(?:\${)(.+?)}/g
    const keys = (this.str.match(rexp) || []).map(match => match.replace(/[\${}]/g, ''));

    return keys.reduce((s, k) => {
      if (stack.indexOf(k) >= 0) {
        throw new Error(`Circular interpolation detected -> ${stack.join(' -> ')} -> ${k}`)
      }

      let value = '';

      for (const source of sources) {
        const tmp = get(source, k);

        if (tmp !== void 0) {
          value = tmp instanceof ComputableString ? tmp.compute(sources, [...stack, k]) : tmp;
          break;
        }
      }
  
      return s.replace('${' + k + '}', value);
    }, this.str);
  }
}

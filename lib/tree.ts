import get from 'lodash.get'

export class Node {
  constructor(
    public root: any,
    public path: string,
    public base: any,
    public key: string|number,
  ) {
    if (base === void 0 || base === null) {
      throw new Error('Node base invalid')
    }
  }

  get value() {
    return this.base[this.key];
  }

  child(subpath: string, base: any) {
    return new Node(this.root, `${this.path}.${subpath}`, base, subpath)
  }

  index(idx: number, base = this.base[this.key]) {
    return new Node(this.root, `${this.path}[${idx}]`, base, idx);
  }

  replace(tranformer: (v: any) => any) {
    this.base[this.key] = tranformer(this.base[this.key]);
  }

  serialize() {
    const self = this;

    return {
      root: this.root,
      path: this.path,
      base: this.base,
      key:  this.key,

      get(path: string) {
        return get(self.base, path)
      },

      get value() {
        return self.base[self.key];
      },

      set(val: any) {
        self.base[self.key] = val;
      }
    }
  }
}

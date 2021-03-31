import get from 'lodash.get'

/**
 * Points to a value in a tree structure
 *
 * @export
 * @class Node
 */
export class Node {
  constructor(
    public root: any,
    public path: string,
    public base: any,
    public key: string|number,
  ) {
    if (base === void 0 || base === null) throw new Error('Node initialized with invalid base')
    if (root === void 0 || root === null) throw new Error('Node initialized with invalid root')
  }

  get value() {
    return this.base[this.key];
  }

  /**
   * Creates a child node in a subkey of the base
   */
  child(subpath: string, base: any = get(this.base, this.key)) {
    return new Node(this.root, `${this.path}.${subpath}`, base, subpath)
  }

  /**
   * Creates a child node at the index of a base array
   */
  index(idx: number, base = this.base[this.key]) {
    return new Node(this.root, `${this.path}[${idx}]`, base, idx);
  }

  /**
   * Using an transformation function, sets the new value of the node
   */
  replace(tranformer: (v: any) => any) {
    this.base[this.key] = tranformer(this.base[this.key]);
  }

  serialize() {
    return {
      root: this.root,
      path: this.path,
      base: this.base,
      key:  this.key,

      get: (path: string) => {
        return get(this.root, path)
      },

      get value() {
        return this.base[this.key];
      },

      set: (val: any) => {
        this.base[this.key] = val;
      }
    }
  }
}

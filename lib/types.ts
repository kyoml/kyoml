export type JsonValue = (
  string  |
  number  |
  boolean |
  Date    |
  Json    |
  Array<JsonValue>
)

export interface Json {
  [key: string]: any
}

export interface Value<T = unknown> {
  type:   string
  value:  T
}

export interface KeyValue<T = unknown> extends Value<T> {
  key: string
}

export interface Block extends Value<KeyValue[]> {
  type:   'Block'
}

export interface ComplexString extends Value<string> {
  type: 'ComplexString'
}

export interface RawString extends Value<string> {
  type: 'RawString'
}

export interface Numeric extends Value<number> {
  type: 'Numeric'
}

export interface Bool extends Value<boolean> {
  type: 'Boolean'
}

export interface List extends Value<Array<Value>> {
  type: 'Array'
}

export class TwoWayMap<K, V> {
  private map: Map<K, V>;
  private invMap: Map<V, K>;

  constructor() {
    this.map = new Map();
    this.invMap = new Map();
  }

  get = (key: K) => this.map.get(key);

  getKey = (value: V) => this.invMap.get(value);

  set = (key: K, value: V) => {
    this.map.set(key, value);
    this.invMap.set(value, key);
  };

  deleteKey = (key: K) => {
    const v = this.map.get(key);
    v && this.invMap.delete(v);
    return this.map.delete(key);
  };

  deleteValue = (value: V) => {
    const key = this.invMap.get(value);
    key && this.map.delete(key);
    return this.invMap.delete(value);
  };

  clear = () => {
    this.map.clear();
    this.invMap.clear();
  };

  hasKey = (key: K) => this.map.has(key);

  hasValue = (value: V) => this.invMap.has(value);

  keys = () => this.map.keys();

  values = () => this.map.values();

  entries = () => this.map.entries();

  valueEntries = () => this.invMap.entries();

  forEach = (
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ) => {
    this.map.forEach(callbackfn, thisArg);
  };

  get size(): number {
    return this.map.size;
  }
}

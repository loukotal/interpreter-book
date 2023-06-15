import { MonkeyObject } from "./object";

export class MonkeyEnvironment {
  store: Map<string, MonkeyObject> = new Map();
  outer: MonkeyEnvironment | null = null;

  constructor(outer: MonkeyEnvironment | null = null) {
    this.outer = outer;
  }

  get(name: string): MonkeyObject | null {
    const obj = this.store.get(name);
    if (obj) {
      return obj;
    }
    if (this.outer) {
      return this.outer.get(name);
    }
    return null;
  }

  set(name: string, value: MonkeyObject) {
    this.store.set(name, value);
  }
}

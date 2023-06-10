export interface MonkeyObject {
  getType: () => MonkeyValue;
  inspect: () => string;
}

export enum MonkeyValue {
  IntegerObj = "INTEGER",
  BooleanObj = "BOOLEAN",
  NullObj = "NULL",
}

export class MonkeyInteger implements MonkeyObject {
  value: number;
  constructor(value: number) {
    this.value = value;
  }

  getType() {
    return MonkeyValue.IntegerObj;
  }

  inspect() {
    return this.value.toString();
  }
}

export class MonkeyBoolean implements MonkeyObject {
  value: boolean;
  constructor(value: boolean) {
    this.value = value;
  }

  getType() {
    return MonkeyValue.BooleanObj;
  }

  inspect() {
    return this.value.toString();
  }
}

export class MonkeyNull implements MonkeyObject {
  getType() {
    return MonkeyValue.NullObj;
  }

  inspect() {
    return "null";
  }
}

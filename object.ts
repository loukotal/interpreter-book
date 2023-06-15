import { Identifier, BlockStatement } from "./ast";
import { MonkeyEnvironment } from "./environment";

export interface MonkeyObject {
  getType: () => MonkeyValue;
  inspect: () => string;
}

export enum MonkeyValue {
  IntegerObj = "INTEGER",
  BooleanObj = "BOOLEAN",
  NullObj = "NULL",
  ReturnValueObj = "RETURN_VALUE",
  ErrorObj = "ERROR",
  FunctionObj = "FUNCTION_OBJ",
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

export class MonkeyReturnValue implements MonkeyObject {
  value: MonkeyObject;
  constructor(value: MonkeyObject) {
    this.value = value;
  }

  getType() {
    return MonkeyValue.ReturnValueObj;
  }

  inspect() {
    return this.value.inspect();
  }
}

export class MonkeyError implements MonkeyObject {
  message: string;
  constructor(message: string) {
    this.message = message;
  }

  getType() {
    return MonkeyValue.ErrorObj;
  }

  inspect() {
    return `ERROR: ${this.message}`;
  }
}

export class MonkeyFunction implements MonkeyObject {
  parameters: Identifier[];
  body: BlockStatement;
  env: MonkeyEnvironment;
  constructor(
    parameters: Identifier[],
    body: BlockStatement,
    env: MonkeyEnvironment
  ) {
    this.parameters = parameters;
    this.body = body;
    this.env = env;
  }

  getType() {
    return MonkeyValue.FunctionObj;
  }

  inspect() {
    return `fn(${this.parameters
      .map((p) => p.toString())
      .join(", ")}) {\n${this.body.toString()}\n}`;
  }
}

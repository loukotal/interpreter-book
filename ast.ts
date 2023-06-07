import { Token, TokenType } from "./token";

interface AstNode {
  tokenLiteral: () => string;
  toString: () => string;
}

export interface Statement extends AstNode {
  type: "statement";
}

export interface Expression extends AstNode {
  value: unknown;
  type: "prefix" | "int" | "ident" | "boolean" | "if" | "function" | "call";
}

export class LetStatement implements Statement {
  type = "statement" as const;
  kind = "let" as const;
  constructor(
    private readonly token: Token,
    readonly name: Identifier,
    readonly value: Expression | null = null
  ) {}

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    return `${this.tokenLiteral()} ${this.name} = ${
      this.value?.toString() ?? ""
    };`;
  }
}

export class ExpressionStatement implements Statement {
  type = "statement" as const;
  kind = "expression" as const;

  constructor(
    private readonly token: Token,
    readonly expression: Expression | null = null
  ) {}

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    return this.expression?.toString() ?? "";
  }
}

export class ReturnStatement implements Statement {
  type = "statement" as const;
  kind = "return" as const;
  constructor(
    private readonly token: Token,
    readonly returnValue: Expression | null = null
  ) {}

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    return `${this.tokenLiteral()} ${this.returnValue?.toString() ?? ""};`;
  }
}

export class InfixExpression implements Expression {
  type = "prefix" as const;
  operator: string;
  right: Expression;
  left: Expression;
  value: string;

  constructor(
    private readonly token: Token,
    left: Expression,
    operator: string,
    right: Expression
  ) {
    this.left = left;
    this.operator = operator;
    this.right = right;
    this.value = operator;
  }

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    return `(${this.left.toString()} ${
      this.operator
    } ${this.right.toString()})`;
  }
}

export class PrefixExpression implements Expression {
  type = "prefix" as const;
  operator: string;
  right: Expression;
  value: string;

  constructor(
    private readonly token: Token,
    operator: string,
    right: Expression
  ) {
    this.operator = operator;
    this.right = right;
    this.value = operator;
  }
  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    return `(${this.operator}${this.right.toString()})`;
  }
}

export class BooleanExpression implements Expression {
  type = "boolean" as const;
  value: boolean;
  constructor(private readonly token: Token, value: boolean) {
    this.value = value;
  }

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    return this.token.literal;
  }
}

export class IfExpression implements Expression {
  type = "if" as const;
  condition: Expression;
  consequence: BlockStatement;
  alternative: BlockStatement | null;
  value: string = "if";
  constructor(
    private readonly token: Token,
    condition: Expression,
    consequence: BlockStatement,
    alternative: BlockStatement | null
  ) {
    this.condition = condition;
    this.consequence = consequence;
    this.alternative = alternative;
  }

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    let st = `if ${this.condition.toString()} ${this.consequence.toString()}`;
    if (this.alternative) {
      st += `else ${this.alternative.toString()}`;
    }
    return st;
  }
}

export class BlockStatement implements Statement {
  type = "statement" as const;
  kind = "block" as const;
  statements: AllStatements[];
  constructor(private readonly token: Token, statements: AllStatements[]) {
    this.statements = statements;
  }
  tokenLiteral() {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    }
    return "";
  }

  toString() {
    let st = "";
    for (const s of this.statements) {
      st += `${s.toString()}`;
    }
    return st;
  }
}

export class FunctionLiteral implements Expression {
  type = "function" as const;
  parameters: Identifier[];
  body: BlockStatement;
  value: string = "fn";
  constructor(
    private readonly token: Token,
    parameters: Identifier[],
    body: BlockStatement
  ) {
    this.parameters = parameters;
    this.body = body;
  }

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    let st = `${this.tokenLiteral()}(`;
    for (let i = 0; i < this.parameters.length; i++) {
      st += this.parameters[i].toString();
      if (i !== this.parameters.length - 1) {
        st += ", ";
      }
    }
    st += `) ${this.body.toString()}`;
    return st;
  }
}

export class CallExpression implements Expression {
  type = "call" as const;
  function: Expression;
  arguments: Expression[];
  value: string = "call";
  constructor(
    private readonly token: Token,
    fn: Expression,
    args: Expression[]
  ) {
    this.function = fn;
    this.arguments = args;
  }

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    let st = `${this.function.toString()}(`;
    for (let i = 0; i < this.arguments.length; i++) {
      st += this.arguments[i].toString();
      if (i !== this.arguments.length - 1) {
        st += ", ";
      }
    }
    st += ")";
    return st;
  }
}

export class Identifier implements Expression {
  type = "ident" as const;
  value: string;
  constructor(private readonly token: Token, value: string) {
    this.value = value;
  }

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    return this.value;
  }
}

export class Integer implements Expression {
  type = "int" as const;
  value: number;
  constructor(private readonly token: Token, value: number) {
    this.value = value;
  }

  tokenLiteral() {
    return this.token.literal;
  }

  toString() {
    return this.token.literal;
  }
}

export class Program implements AstNode {
  statements: AllStatements[];
  constructor(statements: AllStatements[]) {
    this.statements = statements;
  }
  tokenLiteral() {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    }
    return "";
  }

  toString() {
    let st = "";
    for (const s of this.statements) {
      st += `${s.toString()}`;
    }
    return st;
  }
}

export type AllStatements =
  | LetStatement
  | ReturnStatement
  | ExpressionStatement;

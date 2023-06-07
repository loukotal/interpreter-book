import {
  AllStatements,
  BlockStatement,
  BooleanExpression,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteral,
  Identifier,
  IfExpression,
  InfixExpression,
  Integer,
  LetStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
} from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType } from "./token";
import { assertNotNullish } from "./utils";

type PrefixParseFn = (() => Expression | null) & { __brand: "prefix" };
type InfixParseFn = ((e: Expression | null) => Expression | null) & {
  __brand: "infix";
};

function brandPrefix(fn: (e: Expression) => Expression | null): PrefixParseFn {
  return fn as PrefixParseFn;
}

function brandInfix(fn: (e: Expression) => Expression | null): InfixParseFn {
  return fn as InfixParseFn;
}

enum Precedence {
  Lowest = 0,
  Equals,
  LessGreater,
  Sum,
  Product,
  Prefix,
  Call,
}
const precedences: Record<
  Extract<
    TokenType,
    | TokenType.Eq
    | TokenType.NotEq
    | TokenType.Lt
    | TokenType.Gt
    | TokenType.Plus
    | TokenType.Minus
    | TokenType.Slash
    | TokenType.Asterisk
    | TokenType.LeftParen
  >,
  Precedence
> = {
  [TokenType.Eq]: Precedence.Equals,
  [TokenType.NotEq]: Precedence.Equals,
  [TokenType.Lt]: Precedence.LessGreater,
  [TokenType.Gt]: Precedence.LessGreater,
  [TokenType.Plus]: Precedence.Sum,
  [TokenType.Minus]: Precedence.Sum,
  [TokenType.Slash]: Precedence.Product,
  [TokenType.Asterisk]: Precedence.Product,
  [TokenType.LeftParen]: Precedence.Call,
};

export type TokenToParsingFn<T extends PrefixParseFn | InfixParseFn> = Record<
  TokenType,
  T
>;

export class Parser {
  private currToken: Token | null = null;
  private peekToken: Token | null = null;
  private prefixParseFns: TokenToParsingFn<PrefixParseFn> =
    {} as TokenToParsingFn<PrefixParseFn>;
  private infixParseFns: TokenToParsingFn<InfixParseFn> =
    {} as TokenToParsingFn<InfixParseFn>;
  errors: string[];

  constructor(private readonly lexer: Lexer) {
    this.nextToken();
    this.nextToken();
    this.errors = [];

    this.prefixParseFns = {} as TokenToParsingFn<PrefixParseFn>;

    this.registerPrefix(TokenType.Ident, brandPrefix(this.parseIdentifier));
    this.registerPrefix(TokenType.Int, brandPrefix(this.parseIntegerLiteral));
    this.registerPrefix(
      TokenType.Bang,
      brandPrefix(this.parsePrefixExpression)
    );
    this.registerPrefix(
      TokenType.Minus,
      brandPrefix(this.parsePrefixExpression)
    );
    this.registerPrefix(TokenType.True, brandPrefix(this.parseBoolean));
    this.registerPrefix(TokenType.False, brandPrefix(this.parseBoolean));
    this.registerPrefix(
      TokenType.LeftParen,
      brandPrefix(this.parseGroupedExpression)
    );
    this.registerPrefix(TokenType.If, brandPrefix(this.parseIfExpression));
    this.registerPrefix(TokenType.Function, brandPrefix(this.parseFunction));

    this.infixParseFns = {} as TokenToParsingFn<InfixParseFn>;
    this.registerInfix(TokenType.Plus, brandInfix(this.parseInfixExpression));
    this.registerInfix(TokenType.Minus, brandInfix(this.parseInfixExpression));
    this.registerInfix(TokenType.Slash, brandInfix(this.parseInfixExpression));
    this.registerInfix(
      TokenType.Asterisk,
      brandInfix(this.parseInfixExpression)
    );
    this.registerInfix(TokenType.Eq, brandInfix(this.parseInfixExpression));
    this.registerInfix(TokenType.NotEq, brandInfix(this.parseInfixExpression));
    this.registerInfix(TokenType.Lt, brandInfix(this.parseInfixExpression));
    this.registerInfix(TokenType.Gt, brandInfix(this.parseInfixExpression));
    this.registerInfix(
      TokenType.LeftParen,
      brandInfix(this.parseCallExpression)
    );
  }

  private parseCallExpression(left: Expression): Expression | null {
    assertNotNullish(this.currToken);
    const token = this.currToken;
    const args = this.parseCallArguments();
    return new CallExpression(token, left, args);
  }

  private parseCallArguments(): Expression[] {
    const args: Expression[] = [];

    if (this.peekTokenIs(TokenType.RightParen)) {
      this.nextToken();
      return args;
    }
    this.nextToken();

    assertNotNullish(this.currToken);
    const expr = this.parseExpression(Precedence.Lowest);
    if (!expr) {
      return [];
    }
    args.push(expr);

    while (this.peekTokenIs(TokenType.Comma)) {
      this.nextToken();
      this.nextToken();
      const expr = this.parseExpression(Precedence.Lowest);
      if (!expr) {
        continue;
      }
      args.push(expr);
    }

    if (!this.expectPeek(TokenType.RightParen)) {
      return [];
    }

    return args;
  }

  private parsePrefixExpression(): Expression | null {
    assertNotNullish(this.currToken);
    const currToken = this.currToken;
    this.nextToken();
    const right = this.parseExpression(Precedence.Prefix);
    if (!right) {
      throw new Error("explode, no right");
    }
    const expr = new PrefixExpression(currToken, currToken.literal, right);
    return expr;
  }

  private parseFunction(): Expression | null {
    assertNotNullish(this.currToken);
    const currToken = this.currToken;
    if (!this.expectPeek(TokenType.LeftParen)) {
      return null;
    }

    const parameters = this.parseFunctionParameters();
    if (!this.expectPeek(TokenType.LeftBrace)) {
      return null;
    }

    const body = this.parseBlockStatement();
    return new FunctionLiteral(currToken, parameters, body);
  }

  private parseFunctionParameters(): Identifier[] {
    const identifiers: Identifier[] = [];

    if (this.peekTokenIs(TokenType.RightParen)) {
      this.nextToken();
      return identifiers;
    }

    this.nextToken();
    assertNotNullish(this.currToken);
    const ident = new Identifier(this.currToken, this.currToken.literal);
    identifiers.push(ident);

    while (this.peekTokenIs(TokenType.Comma)) {
      this.nextToken();
      this.nextToken();
      assertNotNullish(this.currToken);
      const ident = new Identifier(this.currToken, this.currToken.literal);
      identifiers.push(ident);
    }

    if (!this.expectPeek(TokenType.RightParen)) {
      return [];
    }
    return identifiers;
  }

  private parseIfExpression(): Expression | null {
    assertNotNullish(this.currToken);
    const currToken = this.currToken;
    if (!this.expectPeek(TokenType.LeftParen)) {
      return null;
    }

    this.nextToken();

    const condition = this.parseExpression(Precedence.Lowest);
    if (!this.expectPeek(TokenType.RightParen)) {
      return null;
    }

    if (!this.expectPeek(TokenType.LeftBrace)) {
      return null;
    }

    const consequence = this.parseBlockStatement();
    assertNotNullish(condition);

    let alternative: BlockStatement | null = null;
    if (this.peekTokenIs(TokenType.Else)) {
      this.nextToken();
      if (!this.expectPeek(TokenType.LeftBrace)) {
        return null;
      }
      alternative = this.parseBlockStatement();
    }
    return new IfExpression(currToken, condition, consequence, alternative);
  }

  private parseBlockStatement(): BlockStatement {
    assertNotNullish(this.currToken);
    const currToken = this.currToken;
    const statements: AllStatements[] = [];

    this.nextToken();

    while (
      !this.currTokenIs(TokenType.RightBrace) &&
      !this.currTokenIs(TokenType.Eof)
    ) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
      this.nextToken();
    }
    return new BlockStatement(currToken, statements);
  }

  private parseGroupedExpression(): Expression | null {
    this.nextToken();
    const expr = this.parseExpression(Precedence.Lowest);
    if (!this.expectPeek(TokenType.RightParen)) {
      return null;
    }
    return expr;
  }

  private parseInfixExpression(left: Expression): Expression | null {
    assertNotNullish(this.currToken);
    const currToken = this.currToken;
    const precedence = this.currPrecedence();
    this.nextToken();
    const right = this.parseExpression(precedence);
    if (!right) {
      throw new Error("explode, no right");
    }
    const expr = new InfixExpression(currToken, left, currToken.literal, right);
    return expr;
  }

  private parseIntegerLiteral(): Expression | null {
    assertNotNullish(this.currToken);
    try {
      const value = parseInt(this.currToken.literal);
      const lit = new Integer(this.currToken, value);
      return lit;
    } catch (e) {
      this.errors.push(`could not parse ${this.currToken.literal} as int`);
      return null;
    }
  }

  private parseIdentifier(): Expression {
    assertNotNullish(this.currToken);
    return new Identifier(this.currToken, this.currToken.literal);
  }

  private parseBoolean(): Expression | null {
    assertNotNullish(this.currToken);
    return new BooleanExpression(
      this.currToken,
      this.currTokenIs(TokenType.True)
    );
  }

  private nextToken() {
    this.currToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parseProgram(): Program {
    const program = new Program([]);
    while (this.currToken?.type !== TokenType.Eof) {
      const stmt = this.parseStatement();
      if (stmt) {
        program.statements.push(stmt);
      }
      this.nextToken();
    }
    return program;
  }

  private parseStatement() {
    switch (this.currToken?.type) {
      case TokenType.Let:
        return this.parseLetStatement();
      case TokenType.Return:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseExpressionStatement(): ExpressionStatement | null {
    assertNotNullish(this.currToken);
    const expression = this.parseExpression(Precedence.Lowest);

    const stmt = new ExpressionStatement(this.currToken, expression);
    if (this.peekTokenIs(TokenType.Semicolon)) {
      this.nextToken();
    }
    return stmt;
  }

  private parseExpression(precedence: Precedence): Expression | null {
    assertNotNullish(this.currToken);
    const prefix = this.prefixParseFns[this.currToken.type];

    if (!prefix) {
      this.noPrefixPraseFnError();
      return null;
    }

    let leftExp = prefix();
    while (
      this.peekToken &&
      !this.peekTokenIs(TokenType.Semicolon) &&
      precedence < this.peekPrecedence()
    ) {
      const infix = this.infixParseFns[this.peekToken.type];
      if (!infix) {
        return leftExp;
      }
      this.nextToken();
      leftExp = infix(leftExp);
    }
    return leftExp;
  }

  private parseLetStatement(): LetStatement | null {
    assertNotNullish(this.currToken);

    const token = this.currToken;
    if (!this.expectPeek(TokenType.Ident)) return null;

    const ident = new Identifier(this.currToken, this.currToken?.literal);

    if (!this.expectPeek(TokenType.Assign)) return null;

    this.nextToken();

    const value = this.parseExpression(Precedence.Lowest);

    if (this.peekTokenIs(TokenType.Semicolon)) {
      this.nextToken();
    }

    return new LetStatement(token, ident, value);
  }

  private parseReturnStatement(): ReturnStatement | null {
    assertNotNullish(this.currToken);

    this.nextToken();

    const returnValue = this.parseExpression(Precedence.Lowest);

    if (this.peekTokenIs(TokenType.Semicolon)) {
      this.nextToken();
    }

    return new ReturnStatement(this.currToken, returnValue);
  }

  private expectPeek(t: TokenType): boolean {
    if (this.peekTokenIs(t)) {
      this.nextToken();
      return true;
    }
    this.peekError(t);
    return false;
  }

  private currTokenIs(t: TokenType): boolean {
    return this.currToken?.type === t;
  }

  private peekTokenIs(t: TokenType): boolean {
    return this.peekToken?.type === t;
  }

  private peekError(t: TokenType) {
    const msg = `expected next token to be ${t}, but got ${this.peekToken?.type} instead`;
    this.errors.push(msg);
  }

  private registerPrefix(tokenType: TokenType, fn: PrefixParseFn) {
    this.prefixParseFns[tokenType] = fn.bind(this);
  }
  private registerInfix(tokenType: TokenType, fn: InfixParseFn) {
    this.infixParseFns[tokenType] = fn.bind(this);
  }

  private noPrefixPraseFnError() {
    assertNotNullish(this.currToken);
    this.errors.push(
      `no prefix parse function for ${this.currToken.type} found`
    );
  }

  private peekPrecedence(): Precedence {
    assertNotNullish(this.peekToken);
    if (this.peekToken.type in precedences) {
      return precedences[this.peekToken.type as keyof typeof precedences];
    }
    return Precedence.Lowest;
  }

  private currPrecedence(): Precedence {
    assertNotNullish(this.currToken);
    if (this.currToken.type in precedences) {
      return precedences[this.currToken.type as keyof typeof precedences];
    }
    return Precedence.Lowest;
  }
}

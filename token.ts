export enum TokenType {
  Illegal = "ILLEGAL",
  Eof = "EOF",

  Ident = "IDENT",
  Int = "INT",

  Assign = "=",
  Plus = "+",
  Minus = "-",
  Bang = "!",
  Asterisk = "*",
  Slash = "/",

  Gt = ">",
  Lt = "<",
  Eq = "==",
  NotEq = "!=",

  Comma = ",",
  Semicolon = "SEMICOLON",

  LeftParen = "(",
  RightParen = ")",
  LeftBrace = "{",
  RightBrace = "}",

  Function = "FUNCTION",
  Let = "LET",
  True = "TRUE",
  False = "FALSE",
  If = "IF",
  Else = "ELSE",
  Return = "RETURN",
}

export type Token = {
  type: TokenType;
  literal: string;
};

const keywords: Record<string, TokenType> = {
  let: TokenType.Let,
  fn: TokenType.Function,
  true: TokenType.True,
  false: TokenType.False,
  if: TokenType.If,
  else: TokenType.Else,
  return: TokenType.Return,
};

export function lookupIdent(ident: string) {
  if (ident in keywords) {
    return keywords[ident];
  }
  return TokenType.Ident;
}

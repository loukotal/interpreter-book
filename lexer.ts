import { Token, TokenType, lookupIdent } from "./token";

const EOF = "\0";

export class Lexer {
  input: string;
  private position: number = 0;
  private readPosition: number = 0;
  private ch: string = EOF;

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  private readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = EOF;
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition += 1;
  }

  nextToken(): Token {
    let token: Token;

    this.skipWhitespace();

    switch (this.ch) {
      case "=":
        if (this.peekChar() === "=") {
          const ch = this.ch;
          this.readChar();
          const literal = ch + this.ch;
          token = { type: TokenType.Eq, literal };
        } else {
          token = { type: TokenType.Assign, literal: "=" };
        }
        break;
      case "!":
        if (this.peekChar() === "=") {
          const ch = this.ch;
          this.readChar();
          const literal = ch + this.ch;
          token = { type: TokenType.NotEq, literal };
        } else {
          token = { type: TokenType.Bang, literal: "!" };
        }
        break;
      case ";":
        token = { type: TokenType.Semicolon, literal: ";" };
        break;
      case "(":
        token = { type: TokenType.LeftParen, literal: "(" };
        break;
      case ")":
        token = { type: TokenType.RightParen, literal: ")" };
        break;
      case "{":
        token = { type: TokenType.LeftBrace, literal: "{" };
        break;
      case "}":
        token = { type: TokenType.RightBrace, literal: "}" };
        break;
      case "+":
        token = { type: TokenType.Plus, literal: "+" };
        break;
      case ">":
        token = { type: TokenType.Gt, literal: ">" };
        break;
      case "<":
        token = { type: TokenType.Lt, literal: "<" };
        break;
      case "-":
        token = { type: TokenType.Minus, literal: "-" };
        break;
      case "*":
        token = { type: TokenType.Asterisk, literal: "*" };
        break;
      case "/":
        token = { type: TokenType.Slash, literal: "/" };
        break;
      case ",":
        token = { type: TokenType.Comma, literal: "," };
        break;
      case EOF:
        token = { type: TokenType.Eof, literal: "" };
        break;
      default:
        if (isLetter(this.ch)) {
          const literal = this.readIdentifier();
          return { literal, type: lookupIdent(literal) };
        } else if (isDigit(this.ch)) {
          const literal = this.readNumber();
          return { literal, type: TokenType.Int };
        } else {
          return { type: TokenType.Illegal, literal: this.ch };
        }
    }
    this.readChar();
    return token;
  }

  private peekChar() {
    if (this.readPosition >= this.input.length) {
      return EOF;
    } else {
      return this.input[this.readPosition];
    }
  }

  private readIdentifier(): string {
    const position = this.position;
    while (isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  private readNumber(): string {
    const position = this.position;
    while (isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  private skipWhitespace() {
    while ([" ", "\t", "\n", "\r"].includes(this.ch)) {
      this.readChar();
    }
  }
}

function isLetter(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    ("a".charCodeAt(0) <= code && code <= "z".charCodeAt(0)) ||
    ("A".charCodeAt(0) <= code && code <= "Z".charCodeAt(0)) ||
    code === "_".charCodeAt(0)
  );
}

function isDigit(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return "0".charCodeAt(0) <= code && code <= "9".charCodeAt(0);
}

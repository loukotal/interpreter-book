import { Lexer } from "./lexer";
import { Token, TokenType } from "./token";

describe("Lexer", () => {
  test("NextToken", () => {
    const input = `
let five = 5;
let ten = 10;

let add = fn(x, y) {
  x + y;
};

let result = add(five, ten);
!-/*5;
5 < 10 > 5;

if (5 < 10) {
  return true;
} else {
  return false;
}

10 == 10;
10 != 9;
`;

    const tests: Token[] = [
      { type: TokenType.Let, literal: "let" },
      { type: TokenType.Ident, literal: "five" },
      { type: TokenType.Assign, literal: "=" },
      { type: TokenType.Int, literal: "5" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.Let, literal: "let" },
      { type: TokenType.Ident, literal: "ten" },
      { type: TokenType.Assign, literal: "=" },
      { type: TokenType.Int, literal: "10" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.Let, literal: "let" },
      { type: TokenType.Ident, literal: "add" },
      { type: TokenType.Assign, literal: "=" },
      { type: TokenType.Function, literal: "fn" },
      { type: TokenType.LeftParen, literal: "(" },
      { type: TokenType.Ident, literal: "x" },
      { type: TokenType.Comma, literal: "," },
      { type: TokenType.Ident, literal: "y" },
      { type: TokenType.RightParen, literal: ")" },
      { type: TokenType.LeftBrace, literal: "{" },
      { type: TokenType.Ident, literal: "x" },
      { type: TokenType.Plus, literal: "+" },
      { type: TokenType.Ident, literal: "y" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.RightBrace, literal: "}" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.Let, literal: "let" },
      { type: TokenType.Ident, literal: "result" },
      { type: TokenType.Assign, literal: "=" },
      { type: TokenType.Ident, literal: "add" },
      { type: TokenType.LeftParen, literal: "(" },
      { type: TokenType.Ident, literal: "five" },
      { type: TokenType.Comma, literal: "," },
      { type: TokenType.Ident, literal: "ten" },
      { type: TokenType.RightParen, literal: ")" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.Bang, literal: "!" },
      { type: TokenType.Minus, literal: "-" },
      { type: TokenType.Slash, literal: "/" },
      { type: TokenType.Asterisk, literal: "*" },
      { type: TokenType.Int, literal: "5" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.Int, literal: "5" },
      { type: TokenType.Lt, literal: "<" },
      { type: TokenType.Int, literal: "10" },
      { type: TokenType.Gt, literal: ">" },
      { type: TokenType.Int, literal: "5" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.If, literal: "if" },
      { type: TokenType.LeftParen, literal: "(" },
      { type: TokenType.Int, literal: "5" },
      { type: TokenType.Lt, literal: "<" },
      { type: TokenType.Int, literal: "10" },
      { type: TokenType.RightParen, literal: ")" },
      { type: TokenType.LeftBrace, literal: "{" },
      { type: TokenType.Return, literal: "return" },
      { type: TokenType.True, literal: "true" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.RightBrace, literal: "}" },
      { type: TokenType.Else, literal: "else" },
      { type: TokenType.LeftBrace, literal: "{" },
      { type: TokenType.Return, literal: "return" },
      { type: TokenType.False, literal: "false" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.RightBrace, literal: "}" },
      { type: TokenType.Int, literal: "10" },
      { type: TokenType.Eq, literal: "==" },
      { type: TokenType.Int, literal: "10" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.Int, literal: "10" },
      { type: TokenType.NotEq, literal: "!=" },
      { type: TokenType.Int, literal: "9" },
      { type: TokenType.Semicolon, literal: ";" },
      { type: TokenType.Eof, literal: "" },
    ];

    const lexer = new Lexer(input);

    for (const testCase of tests) {
      const token = lexer.nextToken();
      expect(token.type).toBe(testCase.type);
      expect(token.literal).toBe(testCase.literal);
    }
  });
});

import { AllStatements, Identifier, LetStatement, Program } from "./ast";
import { TokenType } from "./token";

describe("Ast", () => {
  test("toString", () => {
    const input = `let myVar = anotherVar;`;

    const statements: AllStatements[] = [
      new LetStatement(
        { type: TokenType.Let, literal: "let" },
        new Identifier({ type: TokenType.Ident, literal: "myVar" }, "myVar"),
        new Identifier(
          { type: TokenType.Ident, literal: "anotherVar" },
          "anotherVar"
        )
      ),
    ];
    const program = new Program(statements);

    console.log(program.toString());
    expect(program.toString()).toStrictEqual("let myVar = anotherVar;");
  });
});

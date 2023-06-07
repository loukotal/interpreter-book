import {
  AllStatements,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteral,
  IfExpression,
  InfixExpression,
  LetStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
  Statement,
} from "./ast";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { assertNotNullish } from "./utils";

describe("Parser", () => {
  test("Let statements", () => {
    const tests = [
      {
        input: "let x = 5;",
        expectedIdentifier: "x",
        expectedValue: 5,
      },
      {
        input: "let y = true;",
        expectedIdentifier: "y",
        expectedValue: true,
      },
      {
        input: "let foobar = y;",
        expectedIdentifier: "foobar",
        expectedValue: "y",
      },
    ];

    for (const t of tests) {
      const lexer = new Lexer(t.input);
      const parser = new Parser(lexer);
      const program = parser.parseProgram();
      expect(program).not.toBeNull();
      assertNotNullish(program);
      checkParserError(parser);
      expect(program.statements.length).toBe(1);
      const stmt = program.statements[0];
      testLetStatement(stmt, t.expectedIdentifier);
      assertLetStatement(stmt);
      const val = stmt.value;
      assertNotNullish(val);
      testLiteralExpression(val, t.expectedValue);
    }
  });
  test("return statements", () => {
    const test = [
      {
        input: "return 5;",
        expectedValue: 5,
      },

      {
        input: "return true;",
        expectedValue: true,
      },
      {
        input: "return foobar;",
        expectedValue: "foobar",
      },
    ];

    for (const t of test) {
      const lexer = new Lexer(t.input);
      const parser = new Parser(lexer);
      const program = parser.parseProgram();
      checkParserError(parser);
      expect(program.statements.length).toBe(1);
      const stmt = program.statements[0];
      assertReturnStatement(stmt);
      const val = stmt.returnValue;
      assertNotNullish(val);
      testLiteralExpression(val, t.expectedValue);
    }
  });
  test("Identifier expression", () => {
    const input = "foobar;";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserError(p);

    expect(program.statements.length).toBe(1);
    const [stmt] = program.statements;
    expect(stmt.kind).toBe("expression");

    if (stmt.kind === "expression") {
      expect(stmt.expression).not.toBeNull();
      assertNotNullish(stmt.expression);
      expect(stmt.expression.value).toBe("foobar");
      expect(stmt.expression.tokenLiteral()).toBe("foobar");
    }
  });
  test("Integer expression", () => {
    const input = "5;";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserError(p);

    expect(program.statements.length).toBe(1);
    const [stmt] = program.statements;
    expect(stmt.kind).toBe("expression");

    if (stmt.kind === "expression") {
      expect(stmt.expression).not.toBeNull();
      assertNotNullish(stmt.expression);
      expect(stmt.expression.value).toBe(5);
      expect(stmt.expression.tokenLiteral()).toBe("5");
    }
  });
  test("Boolean expression", () => {
    const input = "true;";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserError(p);

    expect(program.statements.length).toBe(1);
    const [stmt] = program.statements;
    expect(stmt.kind).toBe("expression");

    if (stmt.kind === "expression") {
      expect(stmt.expression).not.toBeNull();
      assertNotNullish(stmt.expression);
      expect(stmt.expression.value).toBe(true);
      expect(stmt.expression.tokenLiteral()).toBe("true");
    }
  });
  test("Prefix expressions", () => {
    const tests = [
      {
        input: "!5;",
        operator: "!",
        intValue: 5,
      },
      {
        input: "-15;",
        operator: "-",
        intValue: 15,
      },
    ];

    for (const t of tests) {
      const l = new Lexer(t.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserError(p);

      expect(program.statements.length).toBe(1);
      const [stmt] = program.statements;
      expect(stmt.kind).toBe("expression");

      if (stmt.kind === "expression") {
        const expr = stmt.expression;
        expect(expr).not.toBeNull();
        assertNotNullish(expr);
        assertPrefixExpression(expr);
        expect(expr.operator).toBe(t.operator);
        testIntegerLiteral(expr.right, t.intValue);
      }
    }
  });
  test("Infix expressions", () => {
    const tests = [
      {
        input: "5 + 5",
        left: 5,
        operator: "+",
        right: 5,
      },
      {
        input: "5 - 5",
        left: 5,
        operator: "-",
        right: 5,
      },
      {
        input: "5 * 5",
        left: 5,
        operator: "*",
        right: 5,
      },
      {
        input: "5 / 5",
        left: 5,
        operator: "/",
        right: 5,
      },
      {
        input: "5 > 5",
        left: 5,
        operator: ">",
        right: 5,
      },
      {
        input: "5 < 5",
        left: 5,
        operator: "<",
        right: 5,
      },
      {
        input: "5 == 5",
        left: 5,
        operator: "==",
        right: 5,
      },
      {
        input: "5 != 5",
        left: 5,
        operator: "!=",
        right: 5,
      },
      {
        input: "true == true",
        left: true,
        operator: "==",
        right: true,
      },
      {
        input: "true != false",
        left: true,
        operator: "!=",
        right: false,
      },
      {
        input: "false == false",
        left: false,
        operator: "==",
        right: false,
      },
    ];

    for (const t of tests) {
      const l = new Lexer(t.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserError(p);

      expect(program.statements.length).toBe(1);
      const [stmt] = program.statements;
      expect(stmt.kind).toBe("expression");

      if (stmt.kind === "expression") {
        const expr = stmt.expression;
        expect(expr).not.toBeNull();
        assertNotNullish(expr);
        testInfixExpression(expr, t.left, t.operator, t.right);
      }
    }
  });
  test("Precedence parsing", () => {
    const tests = [
      {
        input: "-a * b",
        expected: "((-a) * b)",
      },
      {
        input: "!-a",
        expected: "(!(-a))",
      },
      {
        input: "a + b + c",
        expected: "((a + b) + c)",
      },
      {
        input: "a + b - c",
        expected: "((a + b) - c)",
      },
      {
        input: "a * b * c",
        expected: "((a * b) * c)",
      },
      {
        input: "a * b / c",
        expected: "((a * b) / c)",
      },
      {
        input: "a + b / c",
        expected: "(a + (b / c))",
      },
      {
        input: "a + b * c + d / e - f",
        expected: "(((a + (b * c)) + (d / e)) - f)",
      },
      {
        input: "3 + 4; -5 * 5",
        expected: "(3 + 4)((-5) * 5)",
      },
      {
        input: "5 > 4 == 3 < 4",
        expected: "((5 > 4) == (3 < 4))",
      },
      {
        input: "5 < 4 != 3 > 4",
        expected: "((5 < 4) != (3 > 4))",
      },
      {
        input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
        expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
      },
      {
        input: "true",
        expected: "true",
      },
      {
        input: "false",
        expected: "false",
      },
      {
        input: "3 > 5 == false",
        expected: "((3 > 5) == false)",
      },
      {
        input: "3 < 5 == true",
        expected: "((3 < 5) == true)",
      },
      {
        input: "1 + (2 + 3) + 4",
        expected: "((1 + (2 + 3)) + 4)",
      },
      {
        input: "(5 + 5) * 2",
        expected: "((5 + 5) * 2)",
      },
      {
        input: "2 / (5 + 5)",
        expected: "(2 / (5 + 5))",
      },
      {
        input: "-(5 + 5)",
        expected: "(-(5 + 5))",
      },
      {
        input: "!(true == true)",
        expected: "(!(true == true))",
      },
      {
        input: "a + add(b * c) + d",
        expected: "((a + add((b * c))) + d)",
      },
      {
        input: "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
        expected: "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
      },
      {
        input: "add(a + b + c * d / f + g)",
        expected: "add((((a + b) + ((c * d) / f)) + g))",
      },
    ];

    for (const t of tests) {
      const l = new Lexer(t.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserError(p);

      expect(program.toString()).toBe(t.expected);
    }
  });
  test("If expression", function () {
    const input = "if (x < y) { x }";

    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserError(p);

    expect(program.statements.length).toBe(1);
    const [stmt] = program.statements;
    expect(stmt.kind).toBe("expression");
    assertIsExpressionStatement(stmt);
    expect(stmt.expression).not.toBeNull();
    assertNotNullish(stmt.expression);
    assertIfExpression(stmt.expression);
    testInfixExpression(stmt.expression.condition, "x", "<", "y");
    expect(stmt.expression.consequence.statements.length).toBe(1);

    const [consequence] = stmt.expression.consequence.statements;
    expect(consequence.kind).toBe("expression");
    assertIsExpressionStatement(consequence);
    assertNotNullish(consequence.expression);
    testIdentifier(consequence.expression, "x");

    expect(stmt.expression.alternative).toBeNull();
  });

  test("If else expression", function () {
    const input = "if (x < y) { x } else { y }";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserError(p);

    expect(program.statements.length).toBe(1);
    const [stmt] = program.statements;
    expect(stmt.kind).toBe("expression");
    assertIsExpressionStatement(stmt);
    expect(stmt.expression).not.toBeNull();
    assertNotNullish(stmt.expression);
    assertIfExpression(stmt.expression);
    testInfixExpression(stmt.expression.condition, "x", "<", "y");
    expect(stmt.expression.consequence.statements.length).toBe(1);

    const [consequence] = stmt.expression.consequence.statements;
    expect(consequence.kind).toBe("expression");
    assertIsExpressionStatement(consequence);
    assertNotNullish(consequence.expression);
    testIdentifier(consequence.expression, "x");

    expect(stmt.expression.alternative).not.toBeNull();
    assertNotNullish(stmt.expression.alternative);
    expect(stmt.expression.alternative.statements.length).toBe(1);
    const [alternative] = stmt.expression.alternative.statements;
    assertIsExpressionStatement(alternative);
    assertNotNullish(alternative.expression);
    testIdentifier(alternative.expression, "y");
  });

  test("Function literal parsing", function () {
    const input = "fn(x, y) { x + y; }";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserError(p);

    expect(program.statements.length).toBe(1);
    const [stmt] = program.statements;
    expect(stmt.kind).toBe("expression");
    assertIsExpressionStatement(stmt);
    expect(stmt.expression).not.toBeNull();
    assertNotNullish(stmt.expression);
    assertFunctionLiteral(stmt.expression);
    expect(stmt.expression.parameters.length).toBe(2);
    testLiteralExpression(stmt.expression.parameters[0], "x");
    testLiteralExpression(stmt.expression.parameters[1], "y");
    expect(stmt.expression.body.statements.length).toBe(1);
    const [bodyStmt] = stmt.expression.body.statements;
    assertIsExpressionStatement(bodyStmt);
    assertNotNullish(bodyStmt.expression);
    assertInfixExpression(bodyStmt.expression);
    testInfixExpression(bodyStmt.expression, "x", "+", "y");
  });

  test("Function parameter parsing", function () {
    const tests = [
      {
        input: "fn() {}",
        expectedParams: [],
      },
      {
        input: "fn(x) {}",
        expectedParams: ["x"],
      },
      {
        input: "fn(x, y, z) {}",
        expectedParams: ["x", "y", "z"],
      },
    ];

    for (const t of tests) {
      const l = new Lexer(t.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserError(p);

      expect(program.statements.length).toBe(1);
      const [stmt] = program.statements;
      expect(stmt.kind).toBe("expression");
      assertIsExpressionStatement(stmt);
      assertNotNullish(stmt.expression);
      assertFunctionLiteral(stmt.expression);
      expect(stmt.expression.parameters.length).toBe(t.expectedParams.length);
      for (let i = 0; i < t.expectedParams.length; i++) {
        testLiteralExpression(
          stmt.expression.parameters[i],
          t.expectedParams[i]
        );
      }
    }
  });
  test("Call expression parsing", function () {
    const input = "add(1, 2 * 3, 4 + 5);";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserError(p);

    expect(program.statements.length).toBe(1);
    const [stmt] = program.statements;
    expect(stmt.kind).toBe("expression");
    assertIsExpressionStatement(stmt);
    assertNotNullish(stmt.expression);

    assertCallExpression(stmt.expression);
    testIdentifier(stmt.expression.function, "add");

    expect(stmt.expression.arguments.length).toBe(3);
    testLiteralExpression(stmt.expression.arguments[0], 1);
    testInfixExpression(stmt.expression.arguments[1], 2, "*", 3);
    testInfixExpression(stmt.expression.arguments[2], 4, "+", 5);
  });
});

function assertLetStatement(s: Statement): asserts s is LetStatement {
  if (!("name" in s) || !("value" in s)) {
    throw new Error("not let statement");
  }
}

function assertReturnStatement(s: Statement): asserts s is ReturnStatement {
  if (!("returnValue" in s)) {
    throw new Error("not return statement");
  }
}

function assertIsExpressionStatement(
  e: AllStatements
): asserts e is ExpressionStatement {
  if (e.kind !== "expression") {
    throw new Error("not expression statement");
  }
}

function assertCallExpression(e: Expression): asserts e is CallExpression {
  if (!("function" in e) || !("arguments" in e)) {
    throw new Error("not call expression");
  }
}

function assertPrefixExpression(e: Expression): asserts e is PrefixExpression {
  if (!("operator" in e) || !("right" in e)) {
    throw new Error("not prefix expression");
  }
}

function assertIfExpression(e: Expression): asserts e is IfExpression {
  if (!("condition" in e) || !("consequence" in e) || !("alternative" in e)) {
    throw new Error("not if expression");
  }
}

function assertInfixExpression(e: Expression): asserts e is InfixExpression {
  if (!("operator" in e) || !("right" in e) || !("left" in e)) {
    throw new Error("not infix expression");
  }
}

function assertFunctionLiteral(
  expression: Expression
): asserts expression is FunctionLiteral {
  if (!("parameters" in expression) || !("body" in expression)) {
    throw new Error("not function literal");
  }
}

function testIdentifier(e: Expression, value: string) {
  if (typeof e.value === "string") {
    expect(e.value).toBe(value);
    expect(e.tokenLiteral()).toBe(value);
  } else {
    expect(`exp: ${value}`).toBe(`${value}`);
  }
}

function testLiteralExpression(e: Expression, expected: any) {
  switch (typeof expected) {
    case "number":
      testIntegerLiteral(e, expected);
      break;
    case "string":
      testIdentifier(e, expected);
      break;
    case "boolean":
      testBooleanLiteral(e, expected);
      break;
    default:
      expect(`exp: ${expected}`).toBe(`${expected}`);
  }
}

function testBooleanLiteral(e: Expression, value: boolean) {
  if (typeof e.value === "boolean") {
    expect(e.value).toBe(value);
    expect(e.tokenLiteral()).toBe(`${value}`);
  } else {
    expect(`exp: ${value}`).toBe(`${value}`);
  }
}

function testInfixExpression(
  e: Expression,
  left: any,
  operator: string,
  right: any
) {
  assertInfixExpression(e);
  testLiteralExpression(e.left, left);
  expect(e.operator).toBe(operator);
  testLiteralExpression(e.right, right);
}

function testIntegerLiteral(e: Expression, value: number) {
  if (typeof e.value === "number") {
    expect(e.value).toBe(value);
    expect(e.tokenLiteral()).toBe(`${value}`);
  } else {
    expect(`exp: ${value}`).toBe(`${value}`);
  }
}

function testLetStatement(s: AllStatements, name: string) {
  expect(s.tokenLiteral()).toBe("let");
  if (s.kind === "let") {
    expect(s.name.value).toBe(name);
    expect(s.name.tokenLiteral()).toBe(name);
  } else {
    expect(false).toBe(true);
  }
}

function checkParserError(p: Parser) {
  const errors = p.errors;
  if (errors.length === 0) {
    return null;
  }
  console.log(errors);
  expect(errors).toBe([]);
}

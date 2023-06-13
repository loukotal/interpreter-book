import { evaluate } from "./evaluator";
import { Lexer } from "./lexer";
import {
  MonkeyBoolean,
  MonkeyError,
  MonkeyInteger,
  MonkeyNull,
  MonkeyObject,
} from "./object";
import { Parser } from "./parser";
import { assertNotNullish } from "./utils";

describe.only("Evaluator", function () {
  test("evaluate integer expression", () => {
    const tests = [
      {
        input: "5",
        expected: 5,
      },
      {
        input: "10",
        expected: 10,
      },
      {
        input: "-5",
        expected: -5,
      },
      {
        input: "-10",
        expected: -10,
      },
      {
        input: "5 + 5 + 5 + 5 - 10",
        expected: 10,
      },
      {
        input: "2 * 2 * 2 * 2 * 2",
        expected: 32,
      },
      {
        input: "-50 + 100 + -50",
        expected: 0,
      },
      {
        input: "5 * 2 + 10",
        expected: 20,
      },
      {
        input: "5 + 2 * 10",
        expected: 25,
      },
      {
        input: "20 + 2 * -10",
        expected: 0,
      },
      {
        input: "50 / 2 * 2 + 10",
        expected: 60,
      },
      {
        input: "2 * (5 + 10)",
        expected: 30,
      },
      {
        input: "3 * 3 * 3 + 10",
        expected: 37,
      },
      {
        input: "3 * (3 * 3) + 10",
        expected: 37,
      },
      {
        input: "(5 + 10 * 2 + 15 / 3) * 2 + -10",
        expected: 50,
      },
    ];
    for (const test of tests) {
      const evaluated = testEval(test.input);
      testIntegerObject(evaluated, test.expected);
    }
  });
  test("evaluate boolean expression", () => {
    const tests = [
      {
        input: "true",
        expected: true,
      },
      {
        input: "false",
        expected: false,
      },
      {
        input: "1 < 2",
        expected: true,
      },
      {
        input: "1 > 2",
        expected: false,
      },
      {
        input: "1 < 1",
        expected: false,
      },
      {
        input: "1 > 1",
        expected: false,
      },
      {
        input: "1 == 1",
        expected: true,
      },
      {
        input: "1 != 1",
        expected: false,
      },
      {
        input: "1 == 2",
        expected: false,
      },
      {
        input: "1 != 2",
        expected: true,
      },
      {
        input: "true == true",
        expected: true,
      },
      {
        input: "false == false",
        expected: true,
      },
      {
        input: "true == false",
        expected: false,
      },
      {
        input: "true != false",
        expected: true,
      },
      {
        input: "false != true",
        expected: true,
      },
      {
        input: "(1 < 2) == true",
        expected: true,
      },
      {
        input: "(1 < 2) == false",
        expected: false,
      },
      {
        input: "(1 > 2) == true",
        expected: false,
      },
      {
        input: "(1 > 2) == false",
        expected: true,
      },
    ];
    for (const test of tests) {
      const evaluated = testEval(test.input);
      testBooleanObject(evaluated, test.expected);
    }
  });
  test("evaluate bang operator", () => {
    const tests = [
      { input: "!true", expected: false },
      { input: "!false", expected: true },
      { input: "!5", expected: false },
      { input: "!!true", expected: true },
      { input: "!!false", expected: false },
      { input: "!!5", expected: true },
    ];
    for (const test of tests) {
      const evaluated = testEval(test.input);
      testBooleanObject(evaluated, test.expected);
    }
  });
  test('evaluate "-" prefix operator', () => {
    const tests = [
      { input: "-5", expected: -5 },
      { input: "-10", expected: -10 },
    ];
    for (const test of tests) {
      const evaluated = testEval(test.input);
      testIntegerObject(evaluated, test.expected);
    }
  });
  test("evaluate if-else expressions", () => {
    const tests = [
      { input: "if (true) { 10 }", expected: 10 },
      { input: "if (false) { 10 }", expected: null },
      { input: "if (1) { 10 }", expected: 10 },
      { input: "if (1 < 2) { 10 }", expected: 10 },
      { input: "if (1 > 2) { 10 }", expected: null },
      { input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
      { input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
    ];
    for (const test of tests) {
      const evaluated = testEval(test.input);
      if (typeof test.expected === "number") {
        testIntegerObject(evaluated, test.expected);
      } else {
        testNullObject(evaluated);
      }
    }
  });
  test("evaluate return statements", () => {
    const tests = [
      { input: "return 10;", expected: 10 },
      { input: "return 10; 9;", expected: 10 },
      { input: "return 2 * 5; 9;", expected: 10 },
      { input: "9; return 2 * 5; 9;", expected: 10 },
      {
        input: `
        if (10 > 1) {
          if (10 > 1) {
            return 10;
          }
          return 1;
        }
        `,
        expected: 10,
      },
    ];
    for (const test of tests) {
      const evaluated = testEval(test.input);
      testIntegerObject(evaluated, test.expected);
    }
  });
  test("evaluate error handling", () => {
    const tests = [
      {
        input: "5 + true;",
        expected: "type mismatch: INTEGER + BOOLEAN",
      },
      {
        input: "5 + true; 5;",
        expected: "type mismatch: INTEGER + BOOLEAN",
      },
      {
        input: "-true",
        expected: "unknown operator: -BOOLEAN",
      },
      {
        input: "true + false;",
        expected: "unknown operator: BOOLEAN + BOOLEAN",
      },
      {
        input: "5; true + false; 5",
        expected: "unknown operator: BOOLEAN + BOOLEAN",
      },
      {
        input: "if (10 > 1) { true + false; }",
        expected: "unknown operator: BOOLEAN + BOOLEAN",
      },
      {
        input: `
        if (10 > 1) {
          if (10 > 1) {
            return true + false;
          }
          return 1;
        }
        `,
        expected: "unknown operator: BOOLEAN + BOOLEAN",
      },
    ];
    for (const test of tests) {
      const evaluated = testEval(test.input);
      expect(evaluated).toBeInstanceOf(MonkeyError);
      const err = evaluated as MonkeyError;
      expect(err.message).toBe(test.expected);
    }
  });
});

function testNullObject(obj: MonkeyObject | null) {
  expect(obj).toBeDefined();
  assertNotNullish(obj);
  expect(obj).toBeInstanceOf(MonkeyNull);
}

function testEval(input: string): any {
  const l = new Lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  return evaluate(program);
}

function testIntegerObject(obj: MonkeyObject | null, expected: number | null) {
  expect(obj).toBeDefined();
  assertNotNullish(obj);
  assertIsMonkeyInteger(obj);
  expect(obj.getType()).toBe("INTEGER");
  expect(obj.value).toBe(expected);
  expect(obj).toBeInstanceOf(MonkeyInteger);
}

function testBooleanObject(obj: MonkeyObject | null, expected: boolean) {
  expect(obj).toBeDefined();
  assertNotNullish(obj);
  assertIsMonkeyBoolean(obj);
  expect(obj.getType()).toBe("BOOLEAN");
  expect(obj.value).toBe(expected);
  expect(obj).toBeInstanceOf(MonkeyBoolean);
}

function assertIsMonkeyBoolean(
  obj: MonkeyObject
): asserts obj is MonkeyBoolean {
  if (!(obj instanceof MonkeyBoolean)) {
    throw new Error("not a MonkeyBoolean");
  }
}

function assertIsMonkeyInteger(
  obj: MonkeyObject
): asserts obj is MonkeyInteger {
  if (!(obj instanceof MonkeyInteger)) {
    throw new Error("not a MonkeyInteger");
  }
}

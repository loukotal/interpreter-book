import { evaluate } from "./evaluator";
import { Lexer } from "./lexer";
import { MonkeyBoolean, MonkeyInteger, MonkeyObject } from "./object";
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
  // test('evaluate "-" prefix operator', () => {
  //   const tests = [
  //     { input: "-5", expected: -5 },
  //     { input: "-10", expected: -10 },
  //     { input: "-true", expected: null },
  //     { input: "-false", expected: null },
  //     { input: "-null", expected: null },
  //   ];
  //   for (const test of tests) {
  //     const evaluated = testEval(test.input);
  //     testIntegerObject(evaluated, test.expected);
  //   }
  // });
});

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

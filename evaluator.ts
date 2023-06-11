import {
  AstNode,
  BooleanExpression,
  Expression,
  ExpressionStatement,
  InfixExpression,
  Integer,
  PrefixExpression,
  Program,
} from "./ast";
import {
  MonkeyBoolean,
  MonkeyInteger,
  MonkeyNull,
  MonkeyObject,
  MonkeyValue,
} from "./object";

const TRUE = new MonkeyBoolean(true);
const FALSE = new MonkeyBoolean(false);
const NULL = new MonkeyNull();

export function evaluate(node: AstNode): MonkeyObject | null {
  if (node instanceof Program) {
    return evaluateStatements(node.statements);
  } else if (node instanceof Integer) {
    return new MonkeyInteger(node.value);
  } else if (node instanceof BooleanExpression) {
    return nativeBooleanToMonkeyBoolean(node.value);
  } else if (node instanceof ExpressionStatement) {
    if (!node.expression) {
      return null;
    }
    return evaluate(node.expression);
  } else if (node instanceof PrefixExpression) {
    const right = evaluate(node.right);
    return evaluatePrefixExpression(node.operator, right);
  } else if (node instanceof InfixExpression) {
    const left = evaluate(node.left);
    const right = evaluate(node.right);
    return evaluateIntegerInfixExpression(node.operator, left, right);
  }
  return null;
}

function nativeBooleanToMonkeyBoolean(input: boolean) {
  return input ? TRUE : FALSE;
}

function evaluateStatements(statements: AstNode[]): MonkeyObject | null {
  let result: MonkeyObject | null = null;
  for (const statement of statements) {
    result = evaluate(statement);
  }
  return result;
}

function evaluatePrefixExpression(
  opetarator: string,
  right: MonkeyObject | null
): MonkeyObject {
  if (!right) {
    return NULL;
  }
  switch (opetarator) {
    case "!":
      return evaluateBangOperatorExpression(right);
    case "-":
      return evaluateMinusPrefixOperatorExpression(right);
    default:
      return NULL;
  }
}

function evaluateBangOperatorExpression(obj: MonkeyObject): MonkeyObject {
  switch (obj) {
    case TRUE:
      return FALSE;
    case FALSE:
      return TRUE;
    case NULL:
      return TRUE;
    default:
      return FALSE;
  }
}

function evaluateMinusPrefixOperatorExpression(obj: MonkeyObject) {
  if (!(obj instanceof MonkeyInteger)) {
    return NULL;
  }
  const value = obj.value;
  return new MonkeyInteger(-value);
}

function evaluateIntegerInfixExpression(
  operator: string,
  left: MonkeyObject | null,
  right: MonkeyObject | null
): MonkeyObject {
  if (left instanceof MonkeyBoolean && right instanceof MonkeyBoolean) {
    switch (operator) {
      case "==":
        return nativeBooleanToMonkeyBoolean(left === right);
      case "!=":
        return nativeBooleanToMonkeyBoolean(left !== right);
    }
  }
  if (!(left instanceof MonkeyInteger) || !(right instanceof MonkeyInteger)) {
    return NULL;
  }
  switch (operator) {
    case "+":
      return new MonkeyInteger(left.value + right.value);
    case "-":
      return new MonkeyInteger(left.value - right.value);
    case "/":
      return new MonkeyInteger(Math.floor(left.value / right.value));
    case "*":
      return new MonkeyInteger(left.value * right.value);
    case "==":
      return nativeBooleanToMonkeyBoolean(left.value === right.value);
    case "!=":
      return nativeBooleanToMonkeyBoolean(left.value !== right.value);
    case ">":
      return nativeBooleanToMonkeyBoolean(left.value > right.value);
    case "<":
      return nativeBooleanToMonkeyBoolean(left.value < right.value);
    default:
      return NULL;
  }
}

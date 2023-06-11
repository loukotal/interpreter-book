import {
  AstNode,
  BooleanExpression,
  ExpressionStatement,
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
  }
  if (node instanceof Integer) {
    return new MonkeyInteger(node.value);
  }
  if (node instanceof BooleanExpression) {
    return nativeBooleanToMonkeyBoolean(node.value);
  }
  if (node instanceof ExpressionStatement) {
    if (!node.expression) {
      return null;
    }
    return evaluate(node.expression);
  }

  if (node instanceof PrefixExpression) {
    const right = evaluate(node.right);
    return evaluatePrefixExpression(node.operator, right);
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

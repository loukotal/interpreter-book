import {
  AstNode,
  BlockStatement,
  BooleanExpression,
  Expression,
  ExpressionStatement,
  IfExpression,
  InfixExpression,
  Integer,
  PrefixExpression,
  Program,
  ReturnStatement,
} from "./ast";
import {
  MonkeyBoolean,
  MonkeyError,
  MonkeyInteger,
  MonkeyNull,
  MonkeyObject,
  MonkeyReturnValue,
  MonkeyValue,
} from "./object";

const TRUE = new MonkeyBoolean(true);
const FALSE = new MonkeyBoolean(false);
const NULL = new MonkeyNull();

export function evaluate(node: AstNode): MonkeyObject | null {
  if (node instanceof Program) {
    return evaluateProgram(node);
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
  } else if (node instanceof BlockStatement) {
    return evaluateBlockStatement(node);
  } else if (node instanceof IfExpression) {
    return evaluateIfExpression(node);
  } else if (node instanceof ReturnStatement) {
    if (node.returnValue) {
      const value = evaluate(node.returnValue);
      if (value) {
        return new MonkeyReturnValue(value);
      }
    }
  }
  return null;
}

function createError(msg: string) {
  return new MonkeyError(msg);
}

function evaluateIfExpression(ie: IfExpression | null) {
  if (!ie) {
    return null;
  }
  const condition = evaluate(ie?.condition);
  if (isTruthy(condition)) {
    return evaluate(ie.consequence);
  } else if (ie.alternative) {
    return evaluate(ie.alternative);
  } else {
    return NULL;
  }
}

function isTruthy(obj: MonkeyObject | null) {
  switch (obj) {
    case NULL:
      return false;
    case TRUE:
      return true;
    case FALSE:
      return false;
    default:
      return true;
  }
}

function nativeBooleanToMonkeyBoolean(input: boolean) {
  return input ? TRUE : FALSE;
}

function evaluateBlockStatement(block: BlockStatement) {
  let result: MonkeyObject | null = null;
  for (const statement of block.statements) {
    result = evaluate(statement);
    if (result) {
      const rt = result.getType();
      if (rt === MonkeyValue.ReturnValueObj || rt === MonkeyValue.ErrorObj) {
        return result;
      }
    }
  }
  return result;
}

function evaluateProgram(program: Program): MonkeyObject | null {
  let result: MonkeyObject | null = null;
  for (const statement of program.statements) {
    result = evaluate(statement);
    if (result instanceof MonkeyReturnValue) {
      return result.value;
    } else if (result instanceof MonkeyError) {
      return result;
    }
  }
  return result;
}

function evaluatePrefixExpression(
  operator: string,
  right: MonkeyObject | null
): MonkeyObject {
  if (!right) {
    return createError(`unknown prefix obj: ${operator} ${right}`);
  }
  switch (operator) {
    case "!":
      return evaluateBangOperatorExpression(right);
    case "-":
      return evaluateMinusPrefixOperatorExpression(right);
    default:
      return createError(`unknown operator: ${operator} ${right.getType()}`);
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
    return createError(`unknown operator: -${obj.getType()}`);
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
      default:
        return createError(
          `unknown operator: ${left.getType()} ${operator} ${right.getType()}`
        );
    }
  }
  if (!(left instanceof MonkeyInteger) || !(right instanceof MonkeyInteger)) {
    return createError(
      `type mismatch: ${left?.getType()} ${operator} ${right?.getType()}`
    );
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
      return createError(
        `unknown operator: ${left.getType()} ${operator} ${right.getType()}`
      );
  }
}

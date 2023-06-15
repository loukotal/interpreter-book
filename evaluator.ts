import {
  AstNode,
  BlockStatement,
  BooleanExpression,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteral,
  Identifier,
  IfExpression,
  InfixExpression,
  Integer,
  LetStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
} from "./ast";
import { MonkeyEnvironment } from "./environment";
import {
  MonkeyBoolean,
  MonkeyError,
  MonkeyFunction,
  MonkeyInteger,
  MonkeyNull,
  MonkeyObject,
  MonkeyReturnValue,
  MonkeyValue,
} from "./object";
import { assertNotNullish } from "./utils";

const TRUE = new MonkeyBoolean(true);
const FALSE = new MonkeyBoolean(false);
const NULL = new MonkeyNull();

export function evaluate(
  node: AstNode,
  env: MonkeyEnvironment
): MonkeyObject | null {
  if (node instanceof Program) {
    return evaluateProgram(node, env);
  } else if (node instanceof Integer) {
    return new MonkeyInteger(node.value);
  } else if (node instanceof BooleanExpression) {
    return nativeBooleanToMonkeyBoolean(node.value);
  } else if (node instanceof ExpressionStatement) {
    if (!node.expression) {
      return null;
    }
    return evaluate(node.expression, env);
  } else if (node instanceof PrefixExpression) {
    const right = evaluate(node.right, env);
    if (isError(right)) {
      return right;
    }
    return evaluatePrefixExpression(node.operator, right);
  } else if (node instanceof InfixExpression) {
    const left = evaluate(node.left, env);
    if (isError(left)) {
      return left;
    }
    const right = evaluate(node.right, env);
    if (isError(right)) {
      return right;
    }
    return evaluateIntegerInfixExpression(node.operator, left, right);
  } else if (node instanceof BlockStatement) {
    return evaluateBlockStatement(node, env);
  } else if (node instanceof IfExpression) {
    return evaluateIfExpression(node, env);
  } else if (node instanceof ReturnStatement) {
    if (node.returnValue) {
      const value = evaluate(node.returnValue, env);
      if (isError(value)) {
        return value;
      }
      if (value) {
        return new MonkeyReturnValue(value);
      }
    }
  } else if (node instanceof LetStatement) {
    if (!node.value) {
      return null;
    }
    const value = evaluate(node.value, env);
    if (isError(value) || value === null) {
      return value;
    }
    env.set(node.name.value, value);
  } else if (node instanceof Identifier) {
    return evaluateIdentifier(node, env);
  } else if (node instanceof FunctionLiteral) {
    return new MonkeyFunction(node.parameters, node.body, env);
  } else if (node instanceof CallExpression) {
    const func = evaluate(node.function, env);
    if (isError(func)) {
      return func;
    }
    const args = evaluateExpressions(node.arguments, env);
    if (args.length === 1 && isError(args[0])) {
      return args[0];
    }
    return applyFunction(func, args);
  }
  return null;
}

function applyFunction(
  fn: MonkeyObject | null,
  args: MonkeyObject[]
): MonkeyObject | null {
  if (fn instanceof MonkeyFunction) {
    const extendedEnv = extendFunctionEnv(fn, args);
    const evaluated = evaluate(fn.body, extendedEnv);
    if (evaluated instanceof MonkeyReturnValue) {
      return evaluated.value;
    }
    return unwrapRetrunValue(evaluated);
  } /* else if (fn instanceof MonkeyBuiltin) {
    return fn.fn(...args);
  } */
  return createError(`not a function: ${fn?.getType()}`);
}

function extendFunctionEnv(
  fn: MonkeyFunction,
  args: MonkeyObject[]
): MonkeyEnvironment {
  const env = new MonkeyEnvironment(fn.env);
  for (let i = 0; i < fn.parameters.length; i++) {
    env.set(fn.parameters[i].value, args[i]);
  }
  return env;
}

function unwrapRetrunValue(obj: MonkeyObject | null): MonkeyObject | null {
  if (obj instanceof MonkeyReturnValue) {
    return obj.value;
  }
  return obj;
}

function evaluateExpressions(
  exps: Expression[],
  env: MonkeyEnvironment
): MonkeyObject[] {
  const result: MonkeyObject[] = [];
  for (const exp of exps) {
    const evaluated = evaluate(exp, env);
    if (evaluated === null) {
      throw new Error("evaluated is null");
    }
    if (isError(evaluated)) {
      return [evaluated];
    }
    result.push(evaluated);
  }
  return result;
}

function evaluateIdentifier(node: Identifier, env: MonkeyEnvironment) {
  const val = env.get(node.value);
  if (val === null) {
    return createError(`identifier not found: ${node.value}`);
  }
  return val;
}

function createError(msg: string) {
  return new MonkeyError(msg);
}

function evaluateIfExpression(ie: IfExpression | null, env: MonkeyEnvironment) {
  if (!ie) {
    return null;
  }
  const condition = evaluate(ie?.condition, env);
  if (isError(condition)) {
    return condition;
  }
  if (isTruthy(condition)) {
    return evaluate(ie.consequence, env);
  } else if (ie.alternative) {
    return evaluate(ie.alternative, env);
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

function isError(m: MonkeyObject | null) {
  if (m) {
    return m.getType() === MonkeyValue.ErrorObj;
  }
  return false;
}

function nativeBooleanToMonkeyBoolean(input: boolean) {
  return input ? TRUE : FALSE;
}

function evaluateBlockStatement(block: BlockStatement, env: MonkeyEnvironment) {
  let result: MonkeyObject | null = null;
  for (const statement of block.statements) {
    result = evaluate(statement, env);
    if (result) {
      const rt = result.getType();
      if (rt === MonkeyValue.ReturnValueObj || rt === MonkeyValue.ErrorObj) {
        return result;
      }
    }
  }
  return result;
}

function evaluateProgram(
  program: Program,
  env: MonkeyEnvironment
): MonkeyObject | null {
  let result: MonkeyObject | null = null;
  for (const statement of program.statements) {
    result = evaluate(statement, env);
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

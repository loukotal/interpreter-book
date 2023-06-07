import * as readline from "readline";
import { Lexer } from "./lexer";
import { TokenType } from "./token";
import { Parser } from "./parser";

export async function startRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  for await (const line of rl) {
    const code = line;
    if (!code) {
      return;
    }
    const l = new Lexer(code);
    const p = new Parser(l);

    const program = p.parseProgram();

    if (p.errors.length) {
      printParserErrors(p.errors);
      continue;
    }

    console.log(program.toString());
  }
}

const MONKEY_FACE = `
            __,__
    .--.  .-"     "-.  .--.
    / .. \\/  .-. .-.  \\/ .. \\
    | |  '|  /   Y   \\  |'  | |
    | \\   \\  \\ 0 | 0 /  /   / |
      \\ '- ,\\.-"""""""-./, -' /
      ''-' /_   ^ ^   _\\ '-''
          |  \\._   _./  |
          \\   \\ '~' /   /
          '._ '-=-' _.'
              '-----'
`;

function printParserErrors(errors: string[]) {
  console.error(MONKEY_FACE);
  console.error("Woops! We ran into some monkey business here!");
  console.error("parser errors:");
  for (const msg of errors) {
    console.error(`\t${msg}`);
  }
}

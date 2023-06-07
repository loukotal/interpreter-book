import { startRepl } from "./repl";

async function main() {
  console.log("Howdy, this is Monkey!");
  await startRepl();
}

main().catch(console.error);

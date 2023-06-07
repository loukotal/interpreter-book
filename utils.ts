export function assertNotNullish<T extends any>(
  a: T | null | undefined
): asserts a is NonNullable<T> {
  if (a === null || a === undefined) {
    throw new Error(`${a} is nullish`);
  }
}

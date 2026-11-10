/** Equal when both are the same value or objects with the same keys and `Object.is` values. */
const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) =>
        Object.hasOwn(b, key) &&
        Object.is(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
    )
  );
};

export default shallowEqual;

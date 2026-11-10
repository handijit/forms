// Structural equality for form values: plain objects, arrays and dates by content, everything
// else (files, class instances, functions) by identity.

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isDeepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) {
    return Object.is(a.getTime(), b.getTime());
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((item, index) => isDeepEqual(item, b[index]))
    );
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a).filter((key) => a[key] !== undefined);
    const otherKeys = Object.keys(b).filter((key) => b[key] !== undefined);
    return (
      keys.length === otherKeys.length &&
      keys.every((key) => Object.hasOwn(b, key) && isDeepEqual(a[key], b[key]))
    );
  }
  return false;
};

export default isDeepEqual;

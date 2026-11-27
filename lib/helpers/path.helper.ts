// Dotted paths into plain values: "items.0.name". Writes copy every object on the way down,
// so a snapshot is never mutated.

const INDEX = /^(?:0|[1-9]\d*)$/;

export const splitPath = (path: string): string[] =>
  path === "" ? [] : path.split(".");

export const isIndex = (segment: string): boolean => INDEX.test(segment);

const childOf = (value: unknown, segment: string): unknown =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[segment]
    : undefined;

export const getPath = (value: unknown, path: string): unknown =>
  splitPath(path).reduce<unknown>(childOf, value);

const setIn = (
  value: unknown,
  segments: readonly string[],
  next: unknown
): unknown => {
  const [head, ...rest] = segments as [string, ...string[]];
  const child =
    rest.length === 0 ? next : setIn(childOf(value, head), rest, next);
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[Number(head)] = child;
    return copy;
  }
  if (typeof value === "object" && value !== null) {
    return { ...value, [head]: child };
  }
  // A missing container is created as what the segment asks for.
  if (isIndex(head)) {
    const created: unknown[] = [];
    created[Number(head)] = child;
    return created;
  }
  return { [head]: child };
};

export const setPath = <T>(value: T, path: string, next: unknown): T =>
  path === "" ? (next as T) : (setIn(value, splitPath(path), next) as T);

/** `child` is `parent` itself or lies below it. */
export const isWithin = (child: string, parent: string): boolean =>
  parent === "" || child === parent || child.startsWith(`${parent}.`);

/** `a` and `b` are on one line of the tree: one contains the other. */
export const isRelated = (a: string, b: string): boolean =>
  isWithin(a, b) || isWithin(b, a);

/** A Zod issue path as a dotted path. */
export const joinPath = (segments: readonly PropertyKey[]): string =>
  segments.map(String).join(".");

/** A server field name as a dotted path: `items[0].name` becomes `items.0.name`. */
export const normalizeServerPath = (name: string): string =>
  name
    .replace(/\[(\w+)\]/g, ".$1")
    .replace(/\//g, ".")
    .replace(/^\./, "");

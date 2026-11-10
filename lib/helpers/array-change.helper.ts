// The array operations of a form as pure functions: the new array and where every old row went,
// so that state kept by path (touched, errors, row keys) moves with its row.

export type ArrayOperation =
  | { type: "insert"; index: number; item: unknown }
  | { type: "remove"; indexes: readonly number[] }
  | { type: "move"; from: number; to: number }
  | { type: "swap"; a: number; b: number }
  | { type: "replace"; items: readonly unknown[] };

export type ArrayChange = {
  next: unknown[];
  /** The new index of an old row; `null` when the row is gone. */
  moved: (index: number) => number | null;
};

const clamp = (index: number, length: number): number =>
  Math.min(Math.max(Math.trunc(index), 0), length);

export const changeArray = (
  current: readonly unknown[],
  operation: ArrayOperation
): ArrayChange => {
  switch (operation.type) {
    case "insert": {
      const at = clamp(operation.index, current.length);
      return {
        next: [...current.slice(0, at), operation.item, ...current.slice(at)],
        moved: (index) => (index >= at ? index + 1 : index),
      };
    }
    case "remove": {
      const gone = new Set(operation.indexes);
      return {
        next: current.filter((_, index) => !gone.has(index)),
        moved: (index) =>
          gone.has(index)
            ? null
            : index - [...gone].filter((removed) => removed < index).length,
      };
    }
    case "move": {
      const last = current.length - 1;
      const from = clamp(operation.from, last);
      const to = clamp(operation.to, last);
      const next = [...current];
      next.splice(to, 0, ...next.splice(from, 1));
      return {
        next,
        moved: (index) => {
          if (index === from) return to;
          if (from < to && index > from && index <= to) return index - 1;
          if (to < from && index >= to && index < from) return index + 1;
          return index;
        },
      };
    }
    case "swap": {
      const next = [...current];
      const { a, b } = operation;
      if (!(a in current && b in current))
        return { next, moved: (index) => index };
      [next[a], next[b]] = [next[b], next[a]];
      return {
        next,
        moved: (index) => (index === a ? b : index === b ? a : index),
      };
    }
    case "replace":
      return { next: [...operation.items], moved: () => null };
  }
};

const ROW = /^(\d+)(\..*)?$/;

/** Renames the keys below `arrayPath` by `moved`; rows that are gone lose their keys. */
export const moveKeys = <T>(
  record: Readonly<Record<string, T>>,
  arrayPath: string,
  moved: (index: number) => number | null
): Record<string, T> => {
  const prefix = `${arrayPath}.`;
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const match = key.startsWith(prefix)
      ? ROW.exec(key.slice(prefix.length))
      : null;
    if (match === null) {
      result[key] = value;
      continue;
    }
    const index = moved(Number(match[1]));
    if (index !== null) result[`${prefix}${index}${match[2] ?? ""}`] = value;
  }
  return result;
};

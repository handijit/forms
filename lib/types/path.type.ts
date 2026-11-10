/** Values a path stops at: they are set as a whole, never walked into. */
export type Leaf =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | Blob
  | ((...args: never[]) => unknown);

// The recursion stops after eight levels, so a recursive type cannot hang the checker.
type Depth = [never, 0, 1, 2, 3, 4, 5, 6, 7];

type PathsOf<T, D extends number> = [D] extends [never]
  ? never
  : T extends Leaf
    ? never
    : T extends readonly (infer E)[]
      ? `${number}` | `${number}.${PathsOf<NonNullable<E>, Depth[D]>}`
      : T extends object
        ? {
            [K in keyof T & string]-?:
              K | `${K}.${PathsOf<NonNullable<T[K]>, Depth[D]>}`;
          }[keyof T & string]
        : never;

/**
 * Every dotted path into `T`: `"email"`, `"address.city"`, `"items.0.price"`. Untyped values
 * (`unknown`) accept any string.
 */
export type FieldPath<T> = unknown extends T
  ? string
  : PathsOf<NonNullable<T>, 7>;

type Step<T, K extends string> = T extends null | undefined
  ? undefined
  : T extends readonly (infer E)[]
    ? K extends keyof T
      ? T[K]
      : K extends `${number}`
        ? E
        : never
    : K extends keyof T
      ? T[K]
      : never;

/** The type of the value at path `P` of `T`; an optional parent adds `undefined`. */
export type FieldPathValue<T, P extends string> = unknown extends T
  ? unknown
  : P extends `${infer Head}.${infer Rest}`
    ? FieldPathValue<Step<T, Head>, Rest>
    : Step<T, P>;

/** The paths of `T` whose value is an array: what `useFieldArray` accepts. */
export type FieldArrayPath<T> =
  FieldPath<T> extends infer P
    ? P extends string
      ? NonNullable<FieldPathValue<T, P>> extends readonly unknown[]
        ? P
        : never
      : never
    : never;

/**
 * The paths of `T` whose value fits `V` (for a binder that writes one kind of value, such as a
 * checkbox). A path whose value is `unknown` (a `z.coerce` input) fits everything.
 */
export type FieldPathByValue<T, V> =
  FieldPath<T> extends infer P
    ? P extends string
      ? [FieldPathValue<T, P>] extends [V]
        ? P
        : unknown extends FieldPathValue<T, P>
          ? P
          : never
      : never
    : never;

/** The element type of the array at path `P`. */
export type FieldArrayItem<T, P extends string> =
  NonNullable<FieldPathValue<T, P>> extends readonly (infer E)[] ? E : never;

/** `T` with every property optional, all the way down: the shape of `defaultValues`. */
export type DeepPartial<T> = T extends Leaf
  ? T
  : T extends readonly (infer E)[]
    ? DeepPartial<E>[]
    : { [K in keyof T]?: DeepPartial<T[K]> };

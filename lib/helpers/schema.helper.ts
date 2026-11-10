import {
  $ZodAsyncError,
  safeParse,
  safeParseAsync,
  type $ZodType,
} from "zod/v4/core";

import { isIndex, joinPath, splitPath } from "./path.helper";

/** A parse, reduced to what a form shows: one message per path, root issues apart. */
export type Validation = {
  data: unknown;
  errors: Record<string, string>;
  formErrors: string[];
};

type Issue = { path: readonly PropertyKey[]; message: string };

type Result =
  | { success: true; data: unknown }
  | { success: false; error: { issues: readonly Issue[] } };

const toValidation = (result: Result): Validation => {
  if (result.success) return { data: result.data, errors: {}, formErrors: [] };
  const errors: Record<string, string> = {};
  const formErrors: string[] = [];
  for (const issue of result.error.issues) {
    const path = joinPath(issue.path);
    if (path === "") {
      if (!formErrors.includes(issue.message)) formErrors.push(issue.message);
    } else if (!Object.hasOwn(errors, path)) {
      errors[path] = issue.message;
    }
  }
  return { data: undefined, errors, formErrors };
};

/**
 * Parses synchronously when it can: a schema with an async refinement throws Zod's async error
 * on the first try, and from then on goes the async way.
 */
export const runSchema = (
  schema: $ZodType,
  values: unknown,
  isAsync: boolean
): Validation | Promise<Validation> => {
  if (!isAsync) {
    try {
      return toValidation(safeParse(schema, values) as Result);
    } catch (error) {
      if (!(error instanceof $ZodAsyncError)) throw error;
    }
  }
  return safeParseAsync(schema, values).then((result) =>
    toValidation(result as Result)
  );
};

// The parts of a schema definition the walk below reads.
type Definition = {
  type: string;
  shape?: Record<string, $ZodType>;
  element?: $ZodType;
  items?: readonly $ZodType[];
  rest?: $ZodType | null;
  valueType?: $ZodType;
  innerType?: $ZodType;
  in?: $ZodType;
  getter?: () => $ZodType;
};

const definitionOf = (schema: $ZodType): Definition =>
  schema._zod.def as unknown as Definition;

/** Strips optional, nullable, default, readonly, catch, pipe (its input side) and lazy. */
const unwrap = (schema: $ZodType): $ZodType => {
  const definition = definitionOf(schema);
  const inner =
    definition.innerType ??
    (definition.type === "pipe" ? definition.in : undefined) ??
    definition.getter?.();
  return inner === undefined ? schema : unwrap(inner);
};

const childSchema = (
  schema: $ZodType,
  segment: string
): $ZodType | undefined => {
  const definition = definitionOf(unwrap(schema));
  switch (definition.type) {
    case "object":
      return definition.shape?.[segment];
    case "array":
      return isIndex(segment) ? definition.element : undefined;
    case "tuple":
      return isIndex(segment)
        ? (definition.items?.[Number(segment)] ?? definition.rest ?? undefined)
        : undefined;
    case "record":
      return definition.valueType;
    default:
      return undefined;
  }
};

/** The schema of the value at `path`, or `undefined` where the walk cannot follow. */
export const schemaAt = (
  schema: $ZodType,
  path: string
): $ZodType | undefined =>
  splitPath(path).reduce<$ZodType | undefined>(
    (current, segment) =>
      current === undefined ? undefined : childSchema(current, segment),
    schema
  );

// The values an untouched field holds, one per kind of input.
const EMPTY_VALUES: readonly unknown[] = [undefined, null, "", false, []];

const accepts = (schema: $ZodType, value: unknown): boolean => {
  try {
    return safeParse(schema, value).success;
  } catch {
    // An async refinement: it cannot be asked synchronously, so it is not called required.
    return true;
  }
};

/** A field is required when its schema rejects every empty value. */
export const isRequiredSchema = (schema: $ZodType | undefined): boolean =>
  schema !== undefined &&
  EMPTY_VALUES.every((value) => !accepts(schema, value));

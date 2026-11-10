/** Only the digits of `text`, at most `limit` of them. */
export const digitsOf = (text: string, limit: number): string =>
  text.replace(/\D/g, "").slice(0, limit);

/** `digits` cut into groups of the given sizes, joined by `separator`. */
export const groupDigits = (
  digits: string,
  sizes: readonly number[],
  separator: string
): string => {
  const groups: string[] = [];
  let rest = digits;
  for (const size of sizes) {
    if (rest === "") break;
    groups.push(rest.slice(0, size));
    rest = rest.slice(size);
  }
  return groups.join(separator);
};

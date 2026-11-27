// Where the caret goes after a mask reshaped the text: after the same number of significant
// characters (letters and digits) as before, so grouping spaces and dots never push it around.

const SIGNIFICANT = /[\p{L}\p{N}]/u;

const countSignificant = (text: string): number =>
  [...text].filter((character) => SIGNIFICANT.test(character)).length;

export const caretAfterMask = (
  raw: string,
  caret: number,
  masked: string
): number => {
  let remaining = countSignificant(raw.slice(0, caret));
  if (remaining === 0) return 0;
  for (let index = 0; index < masked.length; index += 1) {
    if (SIGNIFICANT.test(masked.charAt(index))) remaining -= 1;
    if (remaining === 0) return index + 1;
  }
  return masked.length;
};

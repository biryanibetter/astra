export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  // biome-ignore lint/suspicious/noControlCharactersInRegex: attackers prepend controls to spreadsheet formulas.
  if (/^[\s\u0000-\u001f\u200b-\u200f]*[=+\-@]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

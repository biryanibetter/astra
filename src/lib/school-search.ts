/** Shared English/Arabic normalization; written initials are a single word. */
export function normalizeSchoolSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\b(?:[a-z] +)+[a-z]\b/g, (initials) =>
      initials.replace(/ /g, ""),
    );
}

export function schoolInitials(name: string): string {
  return normalizeSchoolSearch(name)
    .split(" ")
    .filter((word) => !["the", "of", "for", "and", "in"].includes(word))
    .map((word) => word[0])
    .join("");
}

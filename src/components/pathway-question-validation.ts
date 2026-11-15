export function countCharacters(value: string): number {
  return Array.from(value).length;
}

export function validateCharacterCount(
  value: string,
  minimum: number,
  maximum: number,
): { valid: boolean; count: number; message?: string } {
  const count = countCharacters(value);
  if (!value.trim()) {
    return { valid: false, count, message: "This answer is required." };
  }
  if (count < minimum) {
    return {
      valid: false,
      count,
      message: `Add at least ${minimum} characters (currently ${count}).`,
    };
  }
  if (count > maximum) {
    return {
      valid: false,
      count,
      message: `Keep this answer to ${maximum} characters or fewer (currently ${count}).`,
    };
  }
  return { valid: true, count };
}

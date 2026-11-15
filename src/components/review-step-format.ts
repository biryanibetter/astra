const gradeLabels: Record<string, string> = {
  "grade-6-year-7": "Grade 6 / Year 7",
  "grade-7-year-8": "Grade 7 / Year 8",
  "grade-8-year-9": "Grade 8 / Year 9",
  "grade-9-year-10": "Grade 9 / Year 10",
  "grade-10-year-11": "Grade 10 / Year 11",
  "grade-11-year-12": "Grade 11 / Year 12",
  "grade-12-year-13": "Grade 12 / Year 13",
};

export function formatGrade(value: string): string {
  return gradeLabels[value] ?? "Not provided";
}

export function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "Size unavailable";
  if (size < 1000) return `${size} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }

  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value)} ${units[unit]}`;
}

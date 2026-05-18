export function toDateOnlyString(dateVal: unknown): string | null {
  if (dateVal == null || dateVal === "") return null;
  if (typeof dateVal === "string") {
    const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, "0");
    const d = String(dateVal.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

export function normalizeDateInput(dateStr: string): string {
  return dateStr.split("T")[0].slice(0, 10);
}

export function parseLocalDate(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(dateOnly: string): string {
  return parseLocalDate(dateOnly).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

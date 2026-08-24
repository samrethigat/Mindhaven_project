export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(d: string | Date) {
  if (!d) return "";
  if (typeof d === "string") {
    // If format is YYYY-MM-DD or starts with YYYY-MM-DD
    const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const localDate = new Date(year, month, day);
      return localDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
  }
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hh = hour % 12 === 0 ? 12 : hour % 12;
  return `${hh}:${m || "00"} ${ampm}`;
}

export function formatDateTime(d: string | Date) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-teal-100 text-teal-800",
    confirmed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    rescheduled: "bg-blue-100 text-blue-800",
    cancelled: "bg-slate-200 text-slate-600",
    completed: "bg-emerald-100 text-emerald-800",
    missed: "bg-orange-100 text-orange-800",
    cancelledbycounselor: "bg-red-100 text-red-800",
  };
  return map[status?.toLowerCase()] || "bg-slate-100 text-slate-700";
}

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

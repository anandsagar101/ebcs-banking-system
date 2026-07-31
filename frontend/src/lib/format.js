export const formatCurrency = (v, currency = "USD") => {
  if (v === null || v === undefined || v === "") return "-";
  const n = typeof v === "number" ? v : parseFloat(v);
  if (isNaN(n)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
};

export const formatNumber = (v, digits = 2) => {
  if (v === null || v === undefined) return "-";
  const n = typeof v === "number" ? v : parseFloat(v);
  if (isNaN(n)) return "-";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

export const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
};

export const formatDateShort = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
};

export const initials = (name) => {
  if (!name) return "?";
  return name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
};

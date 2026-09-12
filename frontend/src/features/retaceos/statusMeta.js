// 'cancelled' queda reservado en el enum del backend (ver
// backend/retaceos/domain/Retaceo.js): esta pantalla lo muestra si aparece,
// pero ningún endpoint de este módulo lo produce todavía.
export const STATUS_LABELS = {
  registered: "Registrado",
  cancelled: "Cancelado",
};

export const STATUS_BADGE_CLASS = {
  registered: "bg-mint-600/10 text-mint-700 dark:bg-mint/15 dark:text-mint",
  cancelled: "bg-coral-50 text-coral-600 dark:bg-coral/15 dark:text-coral",
};

export const statusLabel = (status) => STATUS_LABELS[status] || status;
export const statusBadgeClass = (status) =>
  STATUS_BADGE_CLASS[status] || "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-night-300";

export const formatMoney = (value, currency) => {
  if (value === undefined || value === null) return "-";
  const amount = Number(value).toFixed(2);
  return currency ? `${currency} ${amount}` : amount;
};

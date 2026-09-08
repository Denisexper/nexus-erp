// 'selected' queda reservado para cuando exista el módulo de órdenes; esta
// pantalla lo muestra si aparece, pero no ofrece ninguna acción para llegar
// a él (ver backend/purchase-quotations/domain/PurchaseQuotation.js).
export const STATUS_LABELS = {
  received: "Recibida",
  selected: "Seleccionada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

export const STATUS_BADGE_CLASS = {
  received: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  selected: "bg-mint-600/10 text-mint-700 dark:bg-mint/15 dark:text-mint",
  rejected: "bg-coral-50 text-coral-600 dark:bg-coral/15 dark:text-coral",
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

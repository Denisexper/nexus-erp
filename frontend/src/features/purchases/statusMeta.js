// 'verified' y 'closed' quedan reservados en el enum del backend (ver
// backend/purchases/domain/Purchase.js) para etapas posteriores de
// conciliación contable; esta pantalla los muestra si aparecen, pero ningún
// endpoint de este módulo los produce hoy.
export const STATUS_LABELS = {
  received: "Recibida",
  verified: "Verificada",
  cancelled: "Cancelada",
  closed: "Cerrada",
};

export const STATUS_BADGE_CLASS = {
  received: "bg-mint-600/10 text-mint-700 dark:bg-mint/15 dark:text-mint",
  verified: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  cancelled: "bg-coral-50 text-coral-600 dark:bg-coral/15 dark:text-coral",
  closed: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-night-300",
};

export const statusLabel = (status) => STATUS_LABELS[status] || status;
export const statusBadgeClass = (status) =>
  STATUS_BADGE_CLASS[status] || "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-night-300";

export const formatMoney = (value, currency) => {
  if (value === undefined || value === null) return "-";
  const amount = Number(value).toFixed(2);
  return currency ? `${currency} ${amount}` : amount;
};

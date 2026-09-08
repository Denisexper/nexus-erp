// 'pending_approval', 'sent', 'partially_received', 'received' y 'closed'
// quedan reservados en el enum del backend para etapas posteriores (ver
// backend/purchase-orders/domain/PurchaseOrder.js); esta pantalla los
// muestra si aparecen, pero ningún endpoint de este módulo los produce hoy.
export const STATUS_LABELS = {
  draft: "Borrador",
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobada",
  sent: "Enviada al proveedor",
  partially_received: "Recibida parcialmente",
  received: "Recibida completamente",
  cancelled: "Cancelada",
  closed: "Cerrada",
};

export const STATUS_BADGE_CLASS = {
  draft: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-night-300",
  pending_approval: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  approved: "bg-mint-600/10 text-mint-700 dark:bg-mint/15 dark:text-mint",
  sent: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  partially_received: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  received: "bg-mint-600/10 text-mint-700 dark:bg-mint/15 dark:text-mint",
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

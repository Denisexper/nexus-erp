// Estados del ciclo de vida de la solicitud (ERS v0.8, cap. 6.8). Los
// últimos 4 (partially_quoted...completed) los va a setear el módulo de
// cotizaciones/órdenes más adelante; acá solo se muestran como lectura.
export const STATUS_LABELS = {
  draft: "Borrador",
  submitted: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  partially_quoted: "Parcialmente cotizada",
  quoted: "Cotizada",
  partially_ordered: "Parcialmente ordenada",
  completed: "Completada",
};

export const STATUS_BADGE_CLASS = {
  draft: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-night-300",
  submitted: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  approved: "bg-mint-600/10 text-mint-700 dark:bg-mint/15 dark:text-mint",
  rejected: "bg-coral-50 text-coral-600 dark:bg-coral/15 dark:text-coral",
  cancelled: "bg-coral-50 text-coral-600 dark:bg-coral/15 dark:text-coral",
  partially_quoted: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  quoted: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  partially_ordered: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  completed: "bg-mint-600/10 text-mint-700 dark:bg-mint/15 dark:text-mint",
};

export const statusLabel = (status) => STATUS_LABELS[status] || status;
export const statusBadgeClass = (status) =>
  STATUS_BADGE_CLASS[status] || "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-night-300";

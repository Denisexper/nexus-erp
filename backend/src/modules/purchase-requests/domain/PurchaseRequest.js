export const PURCHASE_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'cancelled',
  'partially_quoted',
  'quoted',
  'partially_ordered',
  'completed',
];

export class PurchaseRequest {
  constructor({
    id,
    company,
    code,
    branch,
    warehouse,
    user,
    requestDate,
    requiredDate,
    justification,
    status = 'draft',
    notes,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.company = company; // id de Company
    this.code = code; // ej: SCR-00001, único por company
    this.branch = branch; // id de Branch, o subdocumento poblado
    this.warehouse = warehouse; // id de Warehouse (debe pertenecer a branch), o subdocumento poblado
    this.user = user; // id de User que crea la solicitud, o subdocumento poblado
    this.requestDate = requestDate;
    this.requiredDate = requiredDate;
    this.justification = justification;
    this.status = status;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class PurchaseOrderExpenseDocument {
  constructor({ id, purchaseOrderExpense, fileName, filePath, fileType, uploadedAt, createdAt, updatedAt }) {
    this.id = id;
    this.purchaseOrderExpense = purchaseOrderExpense; // id de PurchaseOrderExpense
    this.fileName = fileName; // nombre original del archivo subido
    this.filePath = filePath; // ruta relativa bajo /uploads, ej: purchase-order-expenses/<uuid>.pdf
    this.fileType = fileType; // mimetype
    this.uploadedAt = uploadedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

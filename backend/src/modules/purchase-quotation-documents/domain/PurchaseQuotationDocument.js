export class PurchaseQuotationDocument {
  constructor({ id, purchaseQuotation, fileName, filePath, fileType, uploadedAt, createdAt, updatedAt }) {
    this.id = id;
    this.purchaseQuotation = purchaseQuotation; // id de PurchaseQuotation
    this.fileName = fileName; // nombre original del archivo subido
    this.filePath = filePath; // ruta relativa bajo /uploads, ej: purchase-quotations/<uuid>.pdf
    this.fileType = fileType; // mimetype
    this.uploadedAt = uploadedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

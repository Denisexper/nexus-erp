import multer from 'multer';
import {
  InvalidPurchaseOrderExpenseDocumentIdError,
  PurchaseOrderExpenseDocumentNotFoundError,
  PurchaseOrderExpenseNotFoundForDocumentError,
  MissingExpenseDocumentFileError,
} from '../../domain/errors.js';

const toDocumentDTO = (document) => ({
  _id: document.id,
  id: document.id,
  purchaseOrderExpense: document.purchaseOrderExpense,
  fileName: document.fileName,
  filePath: document.filePath,
  fileType: document.fileType,
  uploadedAt: document.uploadedAt,
});

export class PurchaseOrderExpenseDocumentController {
  constructor({ uploadPurchaseOrderExpenseDocument, listPurchaseOrderExpenseDocuments, deletePurchaseOrderExpenseDocument }) {
    this.uploadPurchaseOrderExpenseDocumentUseCase = uploadPurchaseOrderExpenseDocument;
    this.listPurchaseOrderExpenseDocumentsUseCase = listPurchaseOrderExpenseDocuments;
    this.deletePurchaseOrderExpenseDocumentUseCase = deletePurchaseOrderExpenseDocument;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof multer.MulterError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidPurchaseOrderExpenseDocumentIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof MissingExpenseDocumentFileError) return res.status(400).json({ msj: error.message });
    if (error instanceof PurchaseOrderExpenseDocumentNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof PurchaseOrderExpenseNotFoundForDocumentError) return res.status(404).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const documents = await this.listPurchaseOrderExpenseDocumentsUseCase.execute(req.params.expenseId, req.user.companyId);
      res.status(200).json({
        msj: documents.length === 0 ? 'lista de documentos vacia' : 'Documentos obtenidos correctamente',
        data: documents.map(toDocumentDTO),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo documentos');
    }
  };

  upload = async (req, res) => {
    try {
      if (req.uploadError) throw req.uploadError;
      const relativePath = req.file ? `purchase-order-expenses/${req.file.filename}` : null;
      const document = await this.uploadPurchaseOrderExpenseDocumentUseCase.execute({
        purchaseOrderExpenseId: req.params.expenseId,
        fileName: req.file?.originalname,
        relativePath,
        fileType: req.file?.mimetype,
        companyId: req.user.companyId,
      });
      res.status(201).json({ msj: 'Documento cargado exitosamente', newDocument: toDocumentDTO(document) });
    } catch (error) {
      this.#handleError(res, error, 'Error cargando documento');
    }
  };

  delete = async (req, res) => {
    try {
      await this.deletePurchaseOrderExpenseDocumentUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Documento eliminado correctamente' });
    } catch (error) {
      this.#handleError(res, error, 'Error eliminando documento');
    }
  };
}

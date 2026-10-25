import multer from 'multer';
import {
  InvalidPurchaseQuotationDocumentIdError,
  PurchaseQuotationDocumentNotFoundError,
  PurchaseQuotationNotFoundForDocumentError,
  MissingQuotationDocumentFileError,
} from '../../domain/errors.js';

const toDocumentDTO = (document) => ({
  _id: document.id,
  id: document.id,
  purchaseQuotation: document.purchaseQuotation,
  fileName: document.fileName,
  filePath: document.filePath,
  fileType: document.fileType,
  uploadedAt: document.uploadedAt,
});

export class PurchaseQuotationDocumentController {
  constructor({ uploadPurchaseQuotationDocument, listPurchaseQuotationDocuments, deletePurchaseQuotationDocument }) {
    this.uploadPurchaseQuotationDocumentUseCase = uploadPurchaseQuotationDocument;
    this.listPurchaseQuotationDocumentsUseCase = listPurchaseQuotationDocuments;
    this.deletePurchaseQuotationDocumentUseCase = deletePurchaseQuotationDocument;
  }

  #handleError(res, error, fallbackMsj) {
    if (error instanceof multer.MulterError) return res.status(400).json({ msj: error.message });
    if (error instanceof InvalidPurchaseQuotationDocumentIdError) return res.status(400).json({ msj: error.message });
    if (error instanceof MissingQuotationDocumentFileError) return res.status(400).json({ msj: error.message });
    if (error instanceof PurchaseQuotationDocumentNotFoundError) return res.status(404).json({ msj: error.message });
    if (error instanceof PurchaseQuotationNotFoundForDocumentError) return res.status(404).json({ msj: error.message });
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  getAll = async (req, res) => {
    try {
      const documents = await this.listPurchaseQuotationDocumentsUseCase.execute(req.params.quotationId, req.user.companyId);
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
      const relativePath = req.file ? `purchase-quotations/${req.file.filename}` : null;
      const document = await this.uploadPurchaseQuotationDocumentUseCase.execute({
        purchaseQuotationId: req.params.quotationId,
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
      await this.deletePurchaseQuotationDocumentUseCase.execute(req.params.id, req.user.companyId);
      res.status(200).json({ msj: 'Documento eliminado correctamente' });
    } catch (error) {
      this.#handleError(res, error, 'Error eliminando documento');
    }
  };
}

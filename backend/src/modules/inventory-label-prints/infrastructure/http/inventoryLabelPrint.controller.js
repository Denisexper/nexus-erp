import {
  InventoryLotNotFoundForLabelError,
  InvalidQuantityPrintedError,
  ReprintReasonRequiredError,
} from '../../domain/errors.js';

const BAD_REQUEST_ERRORS = [InvalidQuantityPrintedError, ReprintReasonRequiredError];
const NOT_FOUND_ERRORS = [InventoryLotNotFoundForLabelError];

const toLabelPrintDTO = (labelPrint) => ({
  _id: labelPrint.id,
  id: labelPrint.id,
  inventoryLot: labelPrint.inventoryLot,
  quantityPrinted: labelPrint.quantityPrinted,
  printDate: labelPrint.printDate,
  user: labelPrint.user,
  reprintReason: labelPrint.reprintReason,
  createdAt: labelPrint.createdAt,
});

// RN-INV-016: lo que necesita el frontend para renderizar/imprimir la
// etiqueta física — código de barras (internalCode), lote y fecha de
// recepción, además del propio registro de impresión.
const toLabelPayloadDTO = ({ labelPrint, lot }) => ({
  ...toLabelPrintDTO(labelPrint),
  lotCode: lot.lotCode,
  receivedAt: lot.receivedAt,
  product: {
    _id: lot.product?._id || lot.product,
    name: lot.product?.name,
    internalCode: lot.product?.internalCode,
  },
});

export class InventoryLabelPrintController {
  constructor({ printLabel, listLabelPrints }) {
    this.printLabelUseCase = printLabel;
    this.listLabelPrintsUseCase = listLabelPrints;
  }

  #handleError(res, error, fallbackMsj) {
    if (BAD_REQUEST_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) {
      return res.status(400).json({ msj: error.message });
    }
    if (NOT_FOUND_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) {
      return res.status(404).json({ msj: error.message });
    }
    return res.status(500).json({ msj: fallbackMsj, error: error.message });
  }

  print = async (req, res) => {
    try {
      const { inventoryLot, quantityPrinted, reprintReason } = req.body;
      const result = await this.printLabelUseCase.execute(
        { inventoryLot, quantityPrinted, reprintReason },
        req.user.companyId,
        req.user.id,
      );
      res.status(201).json({
        msj: result.labelPrint.reprintReason ? 'Etiqueta reimpresa correctamente' : 'Etiqueta impresa correctamente',
        newLabelPrint: toLabelPayloadDTO(result),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error imprimiendo la etiqueta');
    }
  };

  getAllByLot = async (req, res) => {
    try {
      const prints = await this.listLabelPrintsUseCase.execute(req.params.lotId, req.user.companyId);
      res.status(200).json({
        msj: prints.length === 0 ? 'este lote no tiene impresiones registradas' : 'Impresiones obtenidas correctamente',
        data: prints.map(toLabelPrintDTO),
      });
    } catch (error) {
      this.#handleError(res, error, 'Error obteniendo el historial de impresiones');
    }
  };
}

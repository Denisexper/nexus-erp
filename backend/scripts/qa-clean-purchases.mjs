import 'dotenv/config';
import mongoose from 'mongoose';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CompanyModel } from '../src/modules/companies/infrastructure/persistence/companyMongooseModel.js';
import { PurchaseRequestModel } from '../src/modules/purchase-requests/infrastructure/persistence/purchaseRequestMongooseModel.js';
import { PurchaseRequestDetailModel } from '../src/modules/purchase-request-details/infrastructure/persistence/purchaseRequestDetailMongooseModel.js';
import { PurchaseQuotationModel } from '../src/modules/purchase-quotations/infrastructure/persistence/purchaseQuotationMongooseModel.js';
import { PurchaseQuotationDetailModel } from '../src/modules/purchase-quotations/infrastructure/persistence/purchaseQuotationDetailMongooseModel.js';
import { PurchaseQuotationExpenseModel } from '../src/modules/purchase-quotations/infrastructure/persistence/purchaseQuotationExpenseMongooseModel.js';
import { PurchaseQuotationRequestModel } from '../src/modules/purchase-quotations/infrastructure/persistence/purchaseQuotationRequestMongooseModel.js';
import { PurchaseQuotationRequestDetailModel } from '../src/modules/purchase-quotations/infrastructure/persistence/purchaseQuotationRequestDetailMongooseModel.js';
import { PurchaseOrderModel } from '../src/modules/purchase-orders/infrastructure/persistence/purchaseOrderMongooseModel.js';
import { PurchaseOrderDetailModel } from '../src/modules/purchase-orders/infrastructure/persistence/purchaseOrderDetailMongooseModel.js';
import { PurchaseOrderExpenseModel } from '../src/modules/purchase-orders/infrastructure/persistence/purchaseOrderExpenseMongooseModel.js';
import { PurchaseOrderExpenseDocumentModel } from '../src/modules/purchase-order-expense-documents/infrastructure/persistence/purchaseOrderExpenseDocumentMongooseModel.js';
import { PurchaseModel } from '../src/modules/purchases/infrastructure/persistence/purchaseMongooseModel.js';
import { PurchaseDetailModel } from '../src/modules/purchases/infrastructure/persistence/purchaseDetailMongooseModel.js';
import { RetaceoModel } from '../src/modules/retaceos/infrastructure/persistence/retaceoMongooseModel.js';
import { RetaceoDetailModel } from '../src/modules/retaceos/infrastructure/persistence/retaceoDetailMongooseModel.js';

// Limpia TODA la data transaccional del módulo de compras (solicitudes,
// cotizaciones, órdenes, recepciones y retaceos) de una sola empresa, para
// poder repetir un ciclo de pruebas desde cero sin arrastrar basura de
// corridas anteriores. No toca catálogos (expense-types, products, etc.)
// ni otras empresas.
const DEFAULT_SLUG = 'qa-distribuciones';
const UPLOADS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads/purchase-order-expenses');

async function run() {
  const slug = process.argv[2] || DEFAULT_SLUG;
  const confirmed = process.argv.includes('--confirm');

  await mongoose.connect(process.env.MONGO_URI);

  const company = await CompanyModel.findOne({ slug }).select('_id name slug');
  if (!company) {
    console.error(`No existe ninguna empresa con slug "${slug}".`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const purchaseRequests = await PurchaseRequestModel.find({ company: company._id }).select('_id');
  const purchaseQuotations = await PurchaseQuotationModel.find({ company: company._id }).select('_id');
  const purchaseOrders = await PurchaseOrderModel.find({ company: company._id }).select('_id');
  const purchases = await PurchaseModel.find({ company: company._id }).select('_id');
  const retaceos = await RetaceoModel.find({ company: company._id }).select('_id');

  const purchaseRequestIds = purchaseRequests.map((d) => d._id);
  const purchaseQuotationIds = purchaseQuotations.map((d) => d._id);
  const purchaseOrderIds = purchaseOrders.map((d) => d._id);
  const purchaseIds = purchases.map((d) => d._id);
  const retaceoIds = retaceos.map((d) => d._id);

  const purchaseQuotationDetails = await PurchaseQuotationDetailModel.find({ purchaseQuotation: { $in: purchaseQuotationIds } }).select('_id');
  const purchaseOrderExpenses = await PurchaseOrderExpenseModel.find({ purchaseOrder: { $in: purchaseOrderIds } }).select('_id');
  const purchaseOrderExpenseDocuments = await PurchaseOrderExpenseDocumentModel.find({ purchaseOrderExpense: { $in: purchaseOrderExpenses.map((d) => d._id) } }).select('filePath');

  console.log(`Empresa objetivo: ${company.name} (${company.slug})`);
  console.log('Documentos a eliminar:');
  console.log(`  Solicitudes de compra:        ${purchaseRequests.length}`);
  console.log(`  Cotizaciones de compra:       ${purchaseQuotations.length}`);
  console.log(`  Órdenes de compra:            ${purchaseOrders.length}`);
  console.log(`  Recepciones (purchases):      ${purchases.length}`);
  console.log(`  Retaceos:                     ${retaceos.length}`);
  console.log(`  Archivos de gastos adjuntos:  ${purchaseOrderExpenseDocuments.length}`);
  console.log('(más sus líneas/detalles y tablas puente asociadas)');

  if (!confirmed) {
    console.log('\nNada se borró todavía. Volvé a correr el script agregando --confirm para aplicar el borrado:');
    console.log(`  node scripts/qa-clean-purchases.mjs ${slug} --confirm`);
    await mongoose.disconnect();
    return;
  }

  for (const doc of purchaseOrderExpenseDocuments) {
    try {
      await unlink(path.join(UPLOADS_DIR, path.basename(doc.filePath)));
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`No se pudo borrar el archivo ${doc.filePath}: ${err.message}`);
    }
  }

  await RetaceoDetailModel.deleteMany({ retaceo: { $in: retaceoIds } });
  await RetaceoModel.deleteMany({ _id: { $in: retaceoIds } });

  await PurchaseDetailModel.deleteMany({ purchase: { $in: purchaseIds } });
  await PurchaseModel.deleteMany({ _id: { $in: purchaseIds } });

  await PurchaseOrderExpenseDocumentModel.deleteMany({ purchaseOrderExpense: { $in: purchaseOrderExpenses.map((d) => d._id) } });
  await PurchaseOrderExpenseModel.deleteMany({ purchaseOrder: { $in: purchaseOrderIds } });
  await PurchaseOrderDetailModel.deleteMany({ purchaseOrder: { $in: purchaseOrderIds } });
  await PurchaseOrderModel.deleteMany({ _id: { $in: purchaseOrderIds } });

  await PurchaseQuotationRequestDetailModel.deleteMany({ purchaseQuotationDetail: { $in: purchaseQuotationDetails.map((d) => d._id) } });
  await PurchaseQuotationRequestModel.deleteMany({ purchaseQuotation: { $in: purchaseQuotationIds } });
  await PurchaseQuotationExpenseModel.deleteMany({ purchaseQuotation: { $in: purchaseQuotationIds } });
  await PurchaseQuotationDetailModel.deleteMany({ purchaseQuotation: { $in: purchaseQuotationIds } });
  await PurchaseQuotationModel.deleteMany({ _id: { $in: purchaseQuotationIds } });

  await PurchaseRequestDetailModel.deleteMany({ purchaseRequest: { $in: purchaseRequestIds } });
  await PurchaseRequestModel.deleteMany({ _id: { $in: purchaseRequestIds } });

  console.log('\nListo. Toda la data de compras de esa empresa quedó limpia (los tipos de gasto y catálogos no se tocaron).');

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});

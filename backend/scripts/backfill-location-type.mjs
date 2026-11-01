import 'dotenv/config';
import mongoose from 'mongoose';
import { LocationModel } from '../src/modules/locations/infrastructure/persistence/locationMongooseModel.js';

// Backfill de una sola vez: las ubicaciones creadas antes de que
// Location.type existiera (fase 3 de Inventario) nunca llegaron a
// persistir el campo, aunque el schema tenga default: 'storage'. Un
// default de Mongoose solo aplica al crear un documento nuevo, no a los
// que ya estaban guardados, así que cualquier filtro { type: 'storage' }
// (como el de Traslados) las deja afuera. Esto las deja explícitas.
async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await LocationModel.updateMany(
    { type: { $exists: false } },
    { $set: { type: 'storage' } },
  );
  console.log(`matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);

  const remaining = await LocationModel.countDocuments({ type: { $exists: false } });
  console.log(`remaining without type: ${remaining}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

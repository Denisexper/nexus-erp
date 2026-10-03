import { PermissionRepository } from '../../domain/PermissionRepository.js';
import { Permission } from '../../domain/Permission.js';
import { PermissionModel } from './permissionMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Permission({
              id: doc._id.toString(),
              code: doc.code,
              resource: doc.resource,
              action: doc.action,
              description: doc.description,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

/**
 * Adaptador concreto del puerto PermissionRepository usando Mongoose.
 */
export class MongoPermissionRepository extends PermissionRepository {
    async findAllActive() {
        const docs = await PermissionModel.find({ isActive: true }).sort({ resource: 1, action: 1 });
        return docs.map(toDomain);
    }

    async upsertByCode(permission) {
        const doc = await PermissionModel.findOneAndUpdate(
            { code: permission.code },
            {
                code: permission.code,
                resource: permission.resource,
                action: permission.action,
                description: permission.description,
                isActive: true,
            },
            { upsert: true, returnDocument: 'after' }
        );
        return toDomain(doc);
    }

    async deactivateMissing(discoveredCodes) {
        await PermissionModel.updateMany(
            { code: { $nin: discoveredCodes }, isActive: true },
            { isActive: false }
        );
    }
}

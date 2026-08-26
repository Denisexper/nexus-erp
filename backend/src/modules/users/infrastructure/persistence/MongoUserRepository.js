import mongoose from 'mongoose';
import { UserRepository } from '../../domain/UserRepository.js';
import { User } from '../../domain/User.js';
import { InvalidUserIdError } from '../../domain/errors.js';
import { UserModel } from './userMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new User({
              id: doc._id.toString(),
              name: doc.name,
              email: doc.email,
              password: doc.password,
              role: doc.role,
              company: doc.company,
              isActive: doc.isActive,
              lastLogin: doc.lastLogin,
              failedLoginAttempts: doc.failedLoginAttempts,
              lockedUntil: doc.lockedUntil,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidUserIdError();
    }
};

/**
 * Adaptador concreto del puerto UserRepository usando Mongoose. Único archivo
 * del módulo que conoce sintaxis de Mongo (ObjectId, $regex, populate).
 */
export class MongoUserRepository extends UserRepository {
    async findAll({ search, role, isActive, skip = 0, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        if (role) filter.role = role;

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const [docs, total] = await Promise.all([
            UserModel.find(filter)
                .populate('role')
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            UserModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id) {
        assertValidId(id);
        const doc = await UserModel.findById(id).populate('role');
        return toDomain(doc);
    }

    async findByEmailAndCompany(email, companyId) {
        const doc = await UserModel.findOne({ email, company: companyId }).populate('role');
        return toDomain(doc);
    }

    async create(user) {
        const doc = await UserModel.create({
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
            company: user.company,
        });
        const populated = await doc.populate('role');
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await UserModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate('role');
        return toDomain(doc);
    }

    async remove(id) {
        assertValidId(id);
        const doc = await UserModel.findByIdAndDelete(id);
        return toDomain(doc);
    }

    async countByRole(roleId) {
        return UserModel.countDocuments({ role: roleId });
    }
}

import mongoose from 'mongoose';
import { EmployeeRepository } from '../../domain/EmployeeRepository.js';
import { Employee } from '../../domain/Employee.js';
import { InvalidEmployeeIdError } from '../../domain/errors.js';
import { EmployeeModel } from './employeeMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Employee({
              id: doc._id.toString(),
              branch: doc.branch,
              firstName: doc.firstName,
              lastName: doc.lastName,
              email: doc.email,
              phone: doc.phone,
              dui: doc.dui,
              position: doc.position,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidEmployeeIdError();
    }
};

const POPULATE = { path: 'branch', select: 'name company' };

/**
 * Adaptador concreto del puerto EmployeeRepository usando Mongoose. Único
 * archivo del módulo que conoce sintaxis de Mongo.
 */
export class MongoEmployeeRepository extends EmployeeRepository {
    async findAll({ search, branch, isActive, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { dui: { $regex: search, $options: 'i' } },
            ];
        }

        if (branch) filter.branch = branch;

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            EmployeeModel.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            EmployeeModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, branchIds) {
        assertValidId(id);
        const filter = branchIds ? { _id: id, branch: { $in: branchIds } } : { _id: id };
        const doc = await EmployeeModel.findOne(filter).populate(POPULATE);
        return toDomain(doc);
    }

    async findByDui(dui) {
        const doc = await EmployeeModel.findOne({ dui });
        return toDomain(doc);
    }

    async findIdsByBranches(branchIds) {
        const docs = await EmployeeModel.find({ branch: { $in: branchIds } }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async create(employee) {
        const doc = await EmployeeModel.create({
            branch: employee.branch,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            dui: employee.dui,
            position: employee.position,
        });
        const populated = await doc.populate(POPULATE);
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await EmployeeModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }
}

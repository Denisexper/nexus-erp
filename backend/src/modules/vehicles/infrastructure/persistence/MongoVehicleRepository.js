import mongoose from 'mongoose';
import { VehicleRepository } from '../../domain/VehicleRepository.js';
import { Vehicle } from '../../domain/Vehicle.js';
import { InvalidVehicleIdError } from '../../domain/errors.js';
import { VehicleModel } from './vehicleMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Vehicle({
              id: doc._id.toString(),
              employee: doc.employee,
              plate: doc.plate,
              brand: doc.brand,
              model: doc.model,
              year: doc.year,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidVehicleIdError();
    }
};

const POPULATE = { path: 'employee', select: 'firstName lastName dui branch' };

/**
 * Adaptador concreto del puerto VehicleRepository usando Mongoose. Único
 * archivo del módulo que conoce sintaxis de Mongo.
 */
export class MongoVehicleRepository extends VehicleRepository {
    async findAll({ search, employee, isActive, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.$or = [
                { plate: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
            ];
        }

        if (employee) filter.employee = employee;

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            VehicleModel.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
            VehicleModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id, employeeIds) {
        assertValidId(id);
        const filter = employeeIds ? { _id: id, employee: { $in: employeeIds } } : { _id: id };
        const doc = await VehicleModel.findOne(filter).populate(POPULATE);
        return toDomain(doc);
    }

    async findByPlate(plate) {
        const doc = await VehicleModel.findOne({ plate: plate?.toUpperCase() });
        return toDomain(doc);
    }

    async findIdsByEmployees(employeeIds) {
        const docs = await VehicleModel.find({ employee: { $in: employeeIds } }).select('_id');
        return docs.map((doc) => doc._id.toString());
    }

    async create(vehicle) {
        const doc = await VehicleModel.create({
            employee: vehicle.employee,
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
        });
        const populated = await doc.populate(POPULATE);
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await VehicleModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(POPULATE);
        return toDomain(doc);
    }
}

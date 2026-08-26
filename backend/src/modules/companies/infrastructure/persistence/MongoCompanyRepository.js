import mongoose from 'mongoose';
import { CompanyRepository } from '../../domain/CompanyRepository.js';
import { Company } from '../../domain/Company.js';
import { InvalidCompanyIdError } from '../../domain/errors.js';
import { CompanyModel } from './companyMongooseModel.js';

const toDomain = (doc) =>
    doc
        ? new Company({
              id: doc._id.toString(),
              name: doc.name,
              commercialName: doc.commercialName,
              slug: doc.slug,
              nit: doc.nit,
              nrc: doc.nrc,
              commercialLine1: doc.commercialLine1,
              commercialLine2: doc.commercialLine2,
              commercialLine3: doc.commercialLine3,
              address: doc.address,
              department: doc.department,
              municipality: doc.municipality,
              district: doc.district,
              phone: doc.phone,
              email: doc.email,
              webSite: doc.webSite,
              logo: doc.logo,
              isActive: doc.isActive,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
          })
        : null;

const assertValidId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new InvalidCompanyIdError();
    }
};

const GEO_POPULATE = [
    { path: 'department', select: 'code name shortName' },
    { path: 'municipality', select: 'code name' },
    { path: 'district', select: 'code name' },
];

/**
 * Adaptador concreto del puerto CompanyRepository usando Mongoose. Es el único
 * archivo del módulo que conoce sintaxis de Mongo ($regex, $or, populate,
 * ObjectId). El dominio y los casos de uso no saben que esta clase existe.
 */
export class MongoCompanyRepository extends CompanyRepository {
    async findAll({ search, isActive, page = 1, limit = 10 } = {}) {
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { commercialName: { $regex: search, $options: 'i' } },
                { nit: { $regex: search, $options: 'i' } },
                { nrc: { $regex: search, $options: 'i' } },
            ];
        }

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === true || isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            CompanyModel.find(filter)
                .select('-__v')
                .populate(GEO_POPULATE)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CompanyModel.countDocuments(filter),
        ]);

        return { items: docs.map(toDomain), total };
    }

    async findById(id) {
        assertValidId(id);
        const doc = await CompanyModel.findById(id).populate(GEO_POPULATE);
        return toDomain(doc);
    }

    async findBySlug(slug) {
        const doc = await CompanyModel.findOne({ slug });
        return toDomain(doc);
    }

    // Nunca traen a memoria nit/nrc/email/phone/address: el .select() limita
    // lo que Mongo devuelve, no es solo un filtro aplicado después.
    async searchPublic({ search, limit = 10 } = {}) {
        const filter = { isActive: true };

        if (search) {
            filter.$or = [
                { commercialName: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
            ];
        }

        const cappedLimit = Math.min(Number(limit) || 10, 10);

        const docs = await CompanyModel.find(filter)
            .select('slug commercialName logo')
            .limit(cappedLimit);

        return docs.map((doc) => ({ slug: doc.slug, commercialName: doc.commercialName, logo: doc.logo }));
    }

    async findPublicBySlug(slug) {
        const doc = await CompanyModel.findOne({ slug, isActive: true }).select('slug commercialName logo');
        return doc ? { slug: doc.slug, commercialName: doc.commercialName, logo: doc.logo } : null;
    }

    async findByNit(nit) {
        const doc = await CompanyModel.findOne({ nit });
        return toDomain(doc);
    }

    async findByNrc(nrc) {
        const doc = await CompanyModel.findOne({ nrc });
        return toDomain(doc);
    }

    async create(company) {
        const doc = await CompanyModel.create({
            name: company.name,
            commercialName: company.commercialName,
            slug: company.slug,
            nit: company.nit,
            nrc: company.nrc,
            commercialLine1: company.commercialLine1,
            commercialLine2: company.commercialLine2,
            commercialLine3: company.commercialLine3,
            address: company.address,
            department: company.department,
            municipality: company.municipality,
            district: company.district,
            phone: company.phone,
            email: company.email,
            webSite: company.webSite,
            logo: company.logo,
        });
        const populated = await doc.populate(GEO_POPULATE);
        return toDomain(populated);
    }

    async update(id, changes) {
        assertValidId(id);
        const doc = await CompanyModel.findByIdAndUpdate(id, changes, {
            new: true,
            runValidators: true,
        }).populate(GEO_POPULATE);
        return toDomain(doc);
    }
}

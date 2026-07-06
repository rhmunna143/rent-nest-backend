import type { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../lib/prisma.client.js";
import { AppError } from "../../utils/AppError.js";
import type {
  CreatePropertyInput,
  ListMeta,
  PropertyListQuery,
  UpdatePropertyInput,
} from "./property.interface.js";

const landlordPublicSelect = {
  id: true,
  name: true,
  profileImage: true,
} as const;

class PropertyService {
  async listPublic(query: PropertyListQuery) {
    const where: Prisma.PropertyWhereInput = { status: "AVAILABLE" };

    if (query.location) {
      where.location = { contains: query.location, mode: "insensitive" };
    }

    if (query.categoryId) where.categoryId = query.categoryId;

    if (query.bedrooms !== undefined) where.bedrooms = query.bedrooms;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.rentAmount = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        include: {
          category: true,
          landlord: { select: landlordPublicSelect },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    const meta: ListMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return { properties, meta };
  }

  // public property details with reviews and average rating
  async getById(id: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        category: true,
        landlord: { select: landlordPublicSelect },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            tenant: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!property) throw new AppError(404, "Property not found");

    const averageRating =
      property.reviews.length > 0
        ? property.reviews.reduce((sum, r) => sum + r.rating, 0) /
          property.reviews.length
        : null;

    return { ...property, averageRating };
  }

  // landlord: create listing
  async create(landlordId: string, input: CreatePropertyInput) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });

    if (!category) throw new AppError(404, "Category not found");

    return prisma.property.create({
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        rentAmount: input.rentAmount,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms ?? 1,
        amenities: input.amenities ?? [],
        images: input.images ?? [],
        landlordId,
        categoryId: input.categoryId,
      },
      include: { category: true },
    });
  }

  // landlord: own listings, all statuses
  async listMine(landlordId: string) {
    return prisma.property.findMany({
      where: { landlordId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // landlord: update own listing (including availability status)
  async update(landlordId: string, id: string, input: UpdatePropertyInput) {
    await this.assertOwnership(landlordId, id);

    if (input.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) throw new AppError(404, "Category not found");
    }

    const data: Prisma.PropertyUncheckedUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.location !== undefined) data.location = input.location;
    if (input.rentAmount !== undefined) data.rentAmount = input.rentAmount;
    if (input.bedrooms !== undefined) data.bedrooms = input.bedrooms;
    if (input.bathrooms !== undefined) data.bathrooms = input.bathrooms;
    if (input.amenities !== undefined) data.amenities = input.amenities;
    if (input.images !== undefined) data.images = input.images;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.status !== undefined) data.status = input.status;

    return prisma.property.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  // landlord: delete own listing — blocked while a rental is ACTIVE
  async remove(landlordId: string, id: string) {
    await this.assertOwnership(landlordId, id);

    const activeRental = await prisma.rentalRequest.findFirst({
      where: { propertyId: id, status: "ACTIVE" },
      select: { id: true },
    });

    if (activeRental) {
      throw new AppError(409, "Cannot delete a property with an active rental");
    }

    await prisma.property.delete({ where: { id } });
  }

  private async assertOwnership(landlordId: string, propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { landlordId: true },
    });

    if (!property) throw new AppError(404, "Property not found");

    if (property.landlordId !== landlordId) {
      throw new AppError(403, "You can only manage your own properties");
    }
  }
}

export default new PropertyService();

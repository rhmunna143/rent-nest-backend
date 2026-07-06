import prisma from "../../lib/prisma.client.js";
import { AppError } from "../../utils/AppError.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.interface.js";

class CategoryService {
  // list all categories (public)
  async list() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { properties: true } } },
    });
  }

  // create category (admin)
  async create(input: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { name: input.name },
      select: { id: true },
    });

    if (existing) {
      throw new AppError(409, "A category with this name already exists");
    }

    return prisma.category.create({ data: { name: input.name } });
  }

  // update category (admin)
  async update(id: string, input: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) throw new AppError(404, "Category not found");

    const duplicate = await prisma.category.findUnique({
      where: { name: input.name },
      select: { id: true },
    });

    if (duplicate && duplicate.id !== id) {
      throw new AppError(409, "A category with this name already exists");
    }

    return prisma.category.update({ where: { id }, data: { name: input.name } });
  }

  // delete category (admin) — blocked while properties reference it
  async remove(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { properties: true } } },
    });

    if (!category) throw new AppError(404, "Category not found");

    if (category._count.properties > 0) {
      throw new AppError(
        409,
        "Cannot delete a category that still has properties",
        { propertyCount: category._count.properties },
      );
    }

    await prisma.category.delete({ where: { id } });
  }
}

export default new CategoryService();

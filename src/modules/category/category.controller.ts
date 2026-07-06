import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import categoryService from "./category.service.js";

class CategoryController {
  list = async (_req: Request, res: Response) => {
    const categories = await categoryService.list();

    sendResponse(res, {
      message: "Categories retrieved successfully",
      data: categories,
    });
  };

  create = async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);

    sendResponse(res, {
      statusCode: 201,
      message: "Category created successfully",
      data: category,
    });
  };

  update = async (req: Request<{ id: string }>, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);

    sendResponse(res, {
      message: "Category updated successfully",
      data: category,
    });
  };

  remove = async (req: Request<{ id: string }>, res: Response) => {
    await categoryService.remove(req.params.id);

    sendResponse(res, { message: "Category deleted successfully" });
  };
}

export default new CategoryController();

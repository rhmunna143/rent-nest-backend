import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import propertyService from "./property.service.js";
import { propertyQuerySchema } from "./property.validation.js";

class PropertyController {
  listPublic = async (req: Request, res: Response) => {
    const query = propertyQuerySchema.parse(req.query);
    const { properties, meta } = await propertyService.listPublic(query);

    sendResponse(res, {
      message: "Properties retrieved successfully",
      data: properties,
      meta,
    });
  };

  getById = async (req: Request<{ id: string }>, res: Response) => {
    const property = await propertyService.getById(req.params.id);

    sendResponse(res, {
      message: "Property retrieved successfully",
      data: property,
    });
  };

  create = async (req: Request, res: Response) => {
    const property = await propertyService.create(req.user!.id, req.body);

    sendResponse(res, {
      statusCode: 201,
      message: "Property created successfully",
      data: property,
    });
  };

  listMine = async (req: Request, res: Response) => {
    const properties = await propertyService.listMine(req.user!.id);

    sendResponse(res, {
      message: "Your properties retrieved successfully",
      data: properties,
    });
  };

  update = async (req: Request<{ id: string }>, res: Response) => {
    const property = await propertyService.update(
      req.user!.id,
      req.params.id,
      req.body,
    );

    sendResponse(res, {
      message: "Property updated successfully",
      data: property,
    });
  };

  remove = async (req: Request<{ id: string }>, res: Response) => {
    await propertyService.remove(req.user!.id, req.params.id);

    sendResponse(res, { message: "Property deleted successfully" });
  };
}

export default new PropertyController();

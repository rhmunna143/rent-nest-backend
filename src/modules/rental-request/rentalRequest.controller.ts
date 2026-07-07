import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import rentalRequestService from "./rentalRequest.service.js";
import { rentalStatusQuerySchema } from "./rentalRequest.validation.js";

class RentalRequestController {
  create = async (req: Request, res: Response) => {
    const request = await rentalRequestService.create(req.user!.id, req.body);

    sendResponse(res, {
      statusCode: 201,
      message: "Rental request submitted successfully",
      data: request,
    });
  };

  listMine = async (req: Request, res: Response) => {
    const query = rentalStatusQuerySchema.parse(req.query);
    const requests = await rentalRequestService.listMine(req.user!.id, query);

    sendResponse(res, {
      message: "Your rental requests retrieved successfully",
      data: requests,
    });
  };

  getMineById = async (req: Request<{ id: string }>, res: Response) => {
    const request = await rentalRequestService.getMineById(
      req.user!.id,
      req.params.id,
    );

    sendResponse(res, {
      message: "Rental request retrieved successfully",
      data: request,
    });
  };

  listForLandlord = async (req: Request, res: Response) => {
    const query = rentalStatusQuerySchema.parse(req.query);
    const requests = await rentalRequestService.listForLandlord(
      req.user!.id,
      query,
    );

    sendResponse(res, {
      message: "Rental requests retrieved successfully",
      data: requests,
    });
  };

  updateStatus = async (req: Request<{ id: string }>, res: Response) => {
    const request = await rentalRequestService.updateStatus(
      req.user!.id,
      req.params.id,
      req.body,
    );

    sendResponse(res, {
      message: `Rental request ${request.status.toLowerCase()} successfully`,
      data: request,
    });
  };
}

export default new RentalRequestController();

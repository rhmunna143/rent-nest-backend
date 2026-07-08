import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import reviewService from "./review.service.js";

class ReviewController {
  create = async (req: Request, res: Response) => {
    const review = await reviewService.create(req.user!.id, req.body);

    sendResponse(res, {
      statusCode: 201,
      message: "Review submitted successfully",
      data: review,
    });
  };
}

export default new ReviewController();

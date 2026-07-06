export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorDetails: unknown = null,
  ) {
    super(message);
    this.name = "AppError";
  }
}

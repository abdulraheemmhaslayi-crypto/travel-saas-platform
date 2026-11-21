import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Handle non-HttpException errors with statuses (e.g. body-parser PayloadTooLargeError)
    if (!(exception instanceof HttpException) && exception && typeof exception === 'object') {
      const err = exception as any;
      if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = 'Uploaded file/payload is too large. Please select a smaller image or document (under 10MB).';
      } else if (err.status && typeof err.status === 'number') {
        status = err.status;
        message = err.message || 'Request failed';
      } else if (err.statusCode && typeof err.statusCode === 'number') {
        status = err.statusCode;
        message = err.message || 'Request failed';
      } else if (err.message && typeof err.message === 'string') {
        message = err.message;
      }
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any)?.message || message,
      error: (message as any)?.error || 'Error',
    };

    console.error(
      `${request.method} ${request.url} - ${status}`,
      JSON.stringify(errorResponse.message),
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }
}
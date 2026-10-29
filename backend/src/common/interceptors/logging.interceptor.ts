import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const userId = request.user?.id || 'anonymous';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          console.log(`${method} ${url} ${response.statusCode} - ${delay}ms - User: ${userId}`);
        },
        error: (error) => {
          const delay = Date.now() - now;
          console.error(`${method} ${url} ${error.status} - ${delay}ms - User: ${userId}`);
        },
      }),
    );
  }
}
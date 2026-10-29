import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Check if the request is indeed an HTTP request
    if (!request || !request.method) {
      return next.handle();
    }

    const { method, route, path } = request;
    const routePath = route?.path || path;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = (Date.now() - start) / 1000; // seconds
          this.metricsService.apiLatency.observe(
            {
              method,
              path: routePath,
              status: response.statusCode ? response.statusCode.toString() : '200',
            },
            duration,
          );
        },
        error: (error) => {
          const duration = (Date.now() - start) / 1000; // seconds
          this.metricsService.apiLatency.observe(
            {
              method,
              path: routePath,
              status: (error.status || error.statusCode || 500).toString(),
            },
            duration,
          );
        },
      }),
    );
  }
}

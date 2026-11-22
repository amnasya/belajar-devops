import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service.js';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const record = (status: number) =>
      this.metrics.httpRequests.inc({
        method: req.method,
        route: req.route?.path ?? 'unknown',
        status: String(status),
      });
    return next.handle().pipe(
      tap({
        next: () => record(res.statusCode),
        error: (e) => record(typeof e?.getStatus === 'function' ? e.getStatus() : 500),
      }),
    );
  }
}

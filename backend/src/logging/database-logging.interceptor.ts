import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from './logging.service';

@Injectable()
export class DatabaseLoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;

        // Log database operation
        this.loggingService.logDatabaseOperation(
          methodName,
          className,
          duration,
          {
            operation: methodName,
            entity: className,
            resultCount: this.getResultCount(data),
            success: true,
          },
        );

        // Log slow queries
        if (duration > 1000) {
          // 1 second threshold
          this.loggingService.warn(
            `Slow database operation detected: ${methodName} in ${className} took ${duration}ms`,
            'SLOW_DATABASE_OPERATION',
            {
              operation: methodName,
              entity: className,
              duration,
              threshold: 1000,
            },
          );
        }
      }),
    );
  }

  /**
   * Get the count of results from the operation
   */
  private getResultCount(data: any): number {
    if (!data) return 0;

    if (Array.isArray(data)) {
      return data.length;
    }

    if (data.count !== undefined) {
      return data.count;
    }

    if (data._count !== undefined) {
      return data._count;
    }

    return 1; // Single result
  }
}

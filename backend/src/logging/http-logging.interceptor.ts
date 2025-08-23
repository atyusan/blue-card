import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService, LogMetadata } from './logging.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract request information
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || 'Unknown';
    const ip = this.getClientIp(request);
    const requestId = this.generateRequestId();

    // Add request ID to response headers
    response.setHeader('X-Request-ID', requestId);

    // Log request start
    this.loggingService.log(
      `Incoming ${method} request to ${url}`,
      'HTTP_REQUEST_START',
      {
        requestId,
        method,
        url,
        ip,
        userAgent,
        headers: this.sanitizeHeaders(request.headers),
        body: this.sanitizeBody(request.body),
        query: request.query,
        params: request.params,
      },
    );

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful response
        this.loggingService.logHttpRequest(
          method,
          url,
          statusCode,
          responseTime,
          {
            requestId,
            ip,
            userAgent,
            responseSize: this.getResponseSize(data),
          },
        );

        // Log business operations if applicable
        this.logBusinessOperation(request, data, responseTime);
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.loggingService.error(
          `HTTP request failed: ${method} ${url}`,
          error.stack,
          'HTTP_REQUEST_ERROR',
          {
            requestId,
            method,
            url,
            ip,
            userAgent,
            statusCode,
            responseTime,
            error: {
              name: error.name,
              message: error.message,
              code: error.code,
            },
          },
        );

        throw error;
      }),
    );
  }

  /**
   * Get client IP address from various headers
   */
  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const connectionRemote = request.connection?.remoteAddress;
    const socketRemote = request.socket?.remoteAddress;

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }

    if (typeof realIp === 'string') {
      return realIp;
    }

    if (typeof connectionRemote === 'string') {
      return connectionRemote;
    }

    if (typeof socketRemote === 'string') {
      return socketRemote;
    }

    return 'Unknown';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-paystack-signature',
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'signature',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Get response size in bytes
   */
  private getResponseSize(data: any): number {
    if (!data) return 0;
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }

  /**
   * Log business operations based on request patterns
   */
  private logBusinessOperation(
    request: Request,
    data: any,
    responseTime: number,
  ): void {
    const url = request.url;
    const method = request.method;
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';

    // Patient operations
    if (url.includes('/patients') && method === 'POST') {
      this.loggingService.logBusinessOperation(
        'CREATE',
        'Patient',
        data?.id || 'unknown',
        {
          requestId,
          responseTime,
        },
      );
    } else if (url.includes('/patients') && method === 'PUT') {
      this.loggingService.logBusinessOperation(
        'UPDATE',
        'Patient',
        request.params.id || 'unknown',
        {
          requestId,
          responseTime,
        },
      );
    }

    // Billing operations
    if (url.includes('/billing') && method === 'POST') {
      this.loggingService.logBusinessOperation(
        'CREATE',
        'Invoice',
        data?.id || 'unknown',
        {
          requestId,
          responseTime,
          amount: data?.totalAmount,
          currency: data?.currency,
        },
      );
    }

    // Payment operations
    if (url.includes('/payments') && method === 'POST') {
      this.loggingService.logBusinessOperation(
        'PROCESS',
        'Payment',
        data?.id || 'unknown',
        {
          requestId,
          responseTime,
          amount: data?.amount,
          currency: data?.currency,
          paymentMethod: data?.paymentMethod,
        },
      );
    }

    // Paystack operations
    if (url.includes('/paystack') && method === 'POST') {
      this.loggingService.logBusinessOperation(
        'PAYSTACK_OPERATION',
        'Payment',
        data?.id || 'unknown',
        {
          requestId,
          responseTime,
          operation: url.split('/').pop(),
        },
      );
    }
  }
}
